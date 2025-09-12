import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuditLog } from './entities/audit-log.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { verifyTOTP, randomBase32Secret } from './totp.util';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  private loginAttempts = new Map<string, { count: number; firstAt: number; lockedUntil?: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly lockoutMs = 10 * 60 * 1000; // 10 minutes
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,

    private readonly jwtService: JwtService,
    private readonly mailer: MailerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      const { password: _, ...userWithoutPassword } = user;

      const accessToken = this.getJwtToken({ id: user.id });
      const refresh = await this.issueRefreshToken(user.id, undefined, undefined);
      return { ...userWithoutPassword, accessToken, refreshToken: refresh };
      // TODO: Retornar el JWT de acceso
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto, userAgent?: string, ip?: string) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }, //! OJO!
    });

    // Rate limit / lockout check
    const key = email.toLowerCase();
    const now = Date.now();
    const state = this.loginAttempts.get(key);
    if (state?.lockedUntil && state.lockedUntil > now)
      throw new UnauthorizedException('Account temporarily locked due to failed attempts');

    if (!user) {
      this.recordLoginFailure(key, now);
      throw new UnauthorizedException('Credentials are not valid (email)');
    }

    if (!bcrypt.compareSync(password, user.password)) {
      this.recordLoginFailure(key, now);
      throw new UnauthorizedException('Credentials are not valid (password)');
    }

    // 2FA requirement
    const fullUser = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: user.id })
      .getOne();
    if (fullUser?.twoFactorEnabled) {
      if (!loginUserDto.twoFactorCode)
        throw new UnauthorizedException('Two-factor code required');
      if (!fullUser.twoFactorSecret)
        throw new UnauthorizedException('2FA not properly configured');
      const ok = verifyTOTP(fullUser.twoFactorSecret, loginUserDto.twoFactorCode);
      if (!ok) throw new UnauthorizedException('Invalid two-factor code');
    }

    // Update last login timestamp (best-effort)
    await this.userRepository.update(user.id, { lastLoginAt: new Date(), lastLoginIp: ip });
    this.loginAttempts.delete(key);
    // audit log
    await this.auditLogRepository.save({
      user: { id: user.id } as User,
      action: 'login',
      metadata: {},
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });

    const { password: _password, ...userWithoutPassword } = user as any;
    const accessToken = this.getJwtToken({ id: user.id });
    const refreshToken = await this.issueRefreshToken(user.id, userAgent, ip);
    return { ...userWithoutPassword, accessToken, refreshToken };
  }

  private recordLoginFailure(key: string, now: number) {
    const prev = this.loginAttempts.get(key);
    let count = 1;
    let firstAt = now;
    let lockedUntil: number | undefined;
    if (prev) {
      if (now - prev.firstAt > this.windowMs) {
        count = 1;
        firstAt = now;
      } else {
        count = prev.count + 1;
        firstAt = prev.firstAt;
      }
    }
    if (count >= this.maxAttempts) {
      lockedUntil = now + this.lockoutMs;
    }
    this.loginAttempts.set(key, { count, firstAt, lockedUntil });
  }

  async checkAuthStatus(user: User) {
    const accessToken = this.getJwtToken({ id: user.id });
    return { ...user, accessToken };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private async issueRefreshToken(userId: string, userAgent?: string, ip?: string) {
    // Step 1: create a token row to obtain ID
    const tokenRow = this.refreshTokenRepository.create({
      user: { id: userId } as User,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      userAgent: userAgent ?? null,
      ip: ip ?? null,
      hashedToken: 'temp',
    });
    await this.refreshTokenRepository.save(tokenRow);

    // Step 2: generate secret and save hashed
    const secret = this.generateRandomSecret();
    const hashed = bcrypt.hashSync(secret, 10);
    await this.refreshTokenRepository.update(tokenRow.id, { hashedToken: hashed });

    // Return opaque token as id.secret
    return `${tokenRow.id}.${secret}`;
  }

  private generateRandomSecret() {
    return crypto.randomBytes(32).toString('base64url');
  }

  async refresh(inputToken: string, userAgent?: string, ip?: string) {
    const { id, secret } = this.parseOpaqueToken(inputToken);
    const record = await this.refreshTokenRepository.findOne({
      where: { id },
      select: {
        id: true,
        hashedToken: true,
        expiresAt: true,
        revokedAt: true,
      },
      relations: ['user'],
    });
    if (!record || !record.user) throw new UnauthorizedException('Invalid refresh token');
    if (record.revokedAt) throw new UnauthorizedException('Refresh token revoked');
    if (record.expiresAt.getTime() < Date.now()) throw new UnauthorizedException('Refresh token expired');
    const valid = bcrypt.compareSync(secret, record.hashedToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    // Rotate: revoke old and issue a new one
    const newToken = await this.issueRefreshToken(record.user.id, userAgent, ip);
    await this.refreshTokenRepository.update(record.id, {
      revokedAt: new Date(),
      replacedByTokenId: newToken.split('.')[0],
    });

    const accessToken = this.getJwtToken({ id: record.user.id });
    return { accessToken, refreshToken: newToken };
  }

  async logout(inputToken: string) {
    const { id } = this.parseOpaqueToken(inputToken);
    const record = await this.refreshTokenRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Refresh token not found');
    if (!record.revokedAt) {
      await this.refreshTokenRepository.update(id, { revokedAt: new Date() });
    }
    return { ok: true };
  }

  async logoutAll(userId: string) {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update()
      .set({ revokedAt: () => 'NOW()' })
      .where('"userId" = :userId', { userId })
      .andWhere('revokedAt IS NULL')
      .execute();
    return { ok: true };
  }

  private parseOpaqueToken(token: string) {
    const parts = token?.split('.') ?? [];
    if (parts.length !== 2 || !parts[0] || !parts[1])
      throw new UnauthorizedException('Malformed refresh token');
    return { id: parts[0], secret: parts[1] };
  }

  // Email verification
  async sendEmailVerification(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.emailVerified) return { ok: true, alreadyVerified: true };

    const secret = this.generateRandomSecret();
    const hashed = bcrypt.hashSync(secret, 10);
    await this.userRepository.update(userId, { emailVerificationToken: hashed });
    const token = `${userId}.${secret}`;
    // Send email (dev fallback logs to console)
    await this.mailer.sendEmailVerification(user.email, token);
    // In dev, return token to ease testing; in prod, omit
    const isProd = process.env.NODE_ENV === 'production' || process.env.STAGE === 'prod';
    return isProd ? { ok: true } : { ok: true, token };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { id, secret } = this.parseOpaqueToken(dto.token);
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        emailVerificationToken: true as any,
      } as any,
    });
    if (!user) throw new UnauthorizedException('Invalid token');
    const stored = (user as any).emailVerificationToken as string | null;
    if (!stored) throw new UnauthorizedException('Invalid token');
    const valid = bcrypt.compareSync(secret, stored);
    if (!valid) throw new UnauthorizedException('Invalid token');
    await this.userRepository.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null as any,
    });
    return { ok: true };
  }

  // Password reset
  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) return { ok: true }; // do not reveal existence
    const secret = this.generateRandomSecret();
    const hashed = bcrypt.hashSync(secret, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await this.userRepository.update(user.id, {
      passwordResetToken: hashed,
      passwordResetTokenExpiresAt: expiresAt,
    });
    const token = `${user.id}.${secret}`;
    // Send email (dev fallback logs to console)
    await this.mailer.sendPasswordReset(user.email, token);
    const isProd = process.env.NODE_ENV === 'production' || process.env.STAGE === 'prod';
    return isProd ? { ok: true } : { ok: true, token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { id, secret } = this.parseOpaqueToken(dto.token);
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        passwordResetToken: true as any,
        passwordResetTokenExpiresAt: true as any,
      } as any,
    });
    if (!user) throw new UnauthorizedException('Invalid token');
    const stored = (user as any).passwordResetToken as string | null;
    const exp = (user as any).passwordResetTokenExpiresAt as Date | null;
    if (!stored || !exp || exp.getTime() < Date.now())
      throw new UnauthorizedException('Invalid or expired token');
    const valid = bcrypt.compareSync(secret, stored);
    if (!valid) throw new UnauthorizedException('Invalid token');
    const newHash = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepository.update(id, {
      password: newHash,
      passwordResetToken: null as any,
      passwordResetTokenExpiresAt: null as any,
    });
    return { ok: true };
  }

  // 2FA
  async setupTwoFactor(userId: string) {
    const secret = randomBase32Secret();
    await this.userRepository.update(userId, { twoFactorSecret: secret, twoFactorEnabled: false });
    // Provide otpauth URL for QR generation
    // For example: otpauth://totp/App:email?secret=SECRET&issuer=App
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const label = encodeURIComponent(`Ahucha:${user?.email ?? userId}`);
    const issuer = encodeURIComponent('Ahucha');
    const otpauth = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpauth };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (!user?.twoFactorSecret) throw new BadRequestException('2FA not initialized');
    const ok = verifyTOTP(user.twoFactorSecret, code);
    if (!ok) throw new UnauthorizedException('Invalid two-factor code');
    await this.userRepository.update(userId, { twoFactorEnabled: true });
    return { ok: true };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.twoFactorSecret')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (user?.twoFactorEnabled) {
      if (!user.twoFactorSecret) throw new BadRequestException('2FA not initialized');
      const ok = verifyTOTP(user.twoFactorSecret, code);
      if (!ok) throw new UnauthorizedException('Invalid two-factor code');
    }
    await this.userRepository.update(userId, { twoFactorEnabled: false, twoFactorSecret: null as any });
    return { ok: true };
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);

    throw new InternalServerErrorException('Please check server logs');
  }
}
