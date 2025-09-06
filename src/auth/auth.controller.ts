import { Controller, Get, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
// Throttle decorators (install @nestjs/throttler)
import { Throttle } from '@nestjs/throttler';

import type { IncomingHttpHeaders } from 'http';

import { AuthService } from './auth.service';
import { RawHeaders, GetUser, Auth } from './decorators';
import { RoleProtected } from './decorators/role-protected.decorator';

import { CreateUserDto, LoginUserDto } from './dto';
import {
  LoginResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
  OkResponseDto,
} from './dto/auth-responses.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshRequestDto } from './dto/refresh-request.dto';
import { TwoFactorCodeDto } from './dto/two-factor-code.dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiOkResponse({ description: 'User created and tokens returned', type: RegisterResponseDto })
  // Body documented via CreateUserDto's ApiProperty fields
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password (2FA supported)' })
  @ApiOkResponse({ description: 'Returns access and refresh tokens', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or 2FA required/invalid' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  @Throttle({ login: { limit: 5, ttl: 60 } })
  // Body documented via LoginUserDto's ApiProperty fields
  loginUser(@Body() loginUserDto: LoginUserDto, @Req() req: any) {
    const ip = (req.ip || req.socket?.remoteAddress) as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;
    return this.authService.login(loginUserDto, userAgent, ip);
  }

  @Get('check-status')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check auth status (refresh access token)' })
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiOkResponse({ description: 'Returns new access and refresh tokens', type: RefreshResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid/expired/revoked refresh token' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts' })
  @Throttle({ refresh: { limit: 30, ttl: 60 } })
  @ApiBody({ type: RefreshRequestDto })
  refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    const ip = (req.ip || req.socket?.remoteAddress) as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;
    return this.authService.refresh(refreshToken, userAgent, ip);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a specific refresh token' })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid token format' })
  @ApiBody({ type: RefreshRequestDto })
  logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('logout-all')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  @ApiOkResponse({ type: OkResponseDto })
  logoutAll(@GetUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  // Email verification
  @Post('email/send-verification')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email verification (dev returns token)' })
  @ApiOkResponse({ type: OkResponseDto })
  sendEmailVerification(@GetUser('id') userId: string) {
    return this.authService.sendEmailVerification(userId);
  }

  @Post('email/verify')
  @ApiOperation({ summary: 'Verify email using token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // Password reset
  @Post('password/request-reset')
  @ApiOperation({ summary: 'Request password reset (dev returns token)' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password using token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // 2FA
  @Post('2fa/setup')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize TOTP secret and get otpauth URL' })
  setup2fa(@GetUser('id') userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  @Post('2fa/enable')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA with a valid TOTP code' })
  @ApiBody({ type: TwoFactorCodeDto })
  enable2fa(@GetUser('id') userId: string, @Body('code') code: string) {
    return this.authService.enableTwoFactor(userId, code);
  }

  @Post('2fa/disable')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA providing a current TOTP code' })
  @ApiBody({ type: TwoFactorCodeDto })
  disable2fa(@GetUser('id') userId: string, @Body('code') code: string) {
    return this.authService.disableTwoFactor(userId, code);
  }

  @Get('private')
  @UseGuards(AuthGuard('jwt'))
  testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,

    @RawHeaders() rawHeaders: string[],
    @Headers() headers: IncomingHttpHeaders,
  ) {
    return {
      ok: true,
      message: 'Hola Mundo Private',
      user,
      userEmail,
      rawHeaders,
      headers,
    };
  }

  // @SetMetadata('roles', ['admin','super-user'])

  @Get('private2')
  @RoleProtected(ValidRoles.superUser, ValidRoles.admin)
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }

  @Get('private3')
  @Auth(ValidRoles.admin)
  privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
