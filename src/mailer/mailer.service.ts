import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: Transporter;
  private from: string;
  private appWebUrl: string;
  private etherealReady?: Promise<void>;
  private usingEthereal = false;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM') || 'No Reply <no-reply@example.com>';
    this.appWebUrl = this.config.get<string>('APP_WEB_URL') || 'http://localhost:4200';

    const provider = (this.config.get<string>('MAIL_PROVIDER') || '').toLowerCase();
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const secure = String(this.config.get<string>('SMTP_SECURE') || 'false') === 'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    try {
      if (provider === 'gmail') {
        if (!user || !pass) throw new Error('Gmail requires SMTP_USER and SMTP_PASS (App Password)');
        this.transporter = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
        this.logger.log('Gmail transporter configured');
      } else if (provider === 'mailtrap') {
        if (!user || !pass) throw new Error('Mailtrap requires SMTP_USER and SMTP_PASS');
        this.transporter = nodemailer.createTransport({ host: 'smtp.mailtrap.io', port: 587, secure: false, auth: { user, pass } });
        this.logger.log('Mailtrap transporter configured');
      } else if (provider === 'smtp') {
        if (!host || !user || !pass) throw new Error('SMTP requires SMTP_HOST, SMTP_USER and SMTP_PASS');
        this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
        this.logger.log(`SMTP transporter configured for ${host}:${port} (secure=${secure})`);
      } else if (host && user && pass) {
        // Fallback: use provided SMTP_* if present even without provider
        this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
        this.logger.log(`SMTP transporter configured for ${host}:${port} (secure=${secure})`);
      } else {
        this.logger.warn('MAIL_PROVIDER not set or incomplete config. Using Ethereal test account for email previews.');
        this.etherealReady = this.setupEtherealTransport();
      }
    } catch (err) {
      this.logger.error(`Failed to configure mail transporter: ${(err as Error).message}`);
      this.logger.warn('Falling back to Ethereal test account.');
      this.etherealReady = this.setupEtherealTransport();
    }
  }

  getFrontendUrl() {
    return this.appWebUrl.replace(/\/$/, '');
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${this.getFrontendUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your password';
    const text =
      `We received a request to reset your password.\n\n` +
      `Click the link below (valid for 1 hour):\n${link}\n\n` +
      `If you didn’t request this, please ignore this email.`;
    const html = `<p>We received a request to reset your password.</p>
      <p><a href="${link}">Reset your password</a> (valid for 1 hour)</p>
      <p>If you didn’t request this, please ignore this email.</p>`;

    await this.dispatch(to, subject, text, html);
  }

  async sendEmailVerification(to: string, token: string) {
    const link = `${this.getFrontendUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email address';
    const text = `Welcome! Please verify your email.\n\n` + `Click the link below:\n${link}`;
    const html = `<p>Welcome! Please verify your email.</p>
      <p><a href="${link}">Verify email</a></p>`;

    await this.dispatch(to, subject, text, html);
  }

  private async dispatch(to: string, subject: string, text: string, html: string) {
    if (!this.transporter && this.etherealReady) {
      try {
        await this.etherealReady;
      } catch (e) {
        this.logger.error('Failed to initialize Ethereal transporter', e as any);
      }
    }

    if (!this.transporter) {
      // Ultimate fallback: log to console
      this.logger.log(`MAIL (logged): to=${to} subject="${subject}"\n${text}`);
      return;
    }
    const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    if (this.usingEthereal) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) this.logger.log(`Ethereal email preview: ${url}`);
    }
  }

  private async setupEtherealTransport() {
    const testAccount = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    this.usingEthereal = true;
    this.logger.log(`Ethereal test SMTP ready (user: ${testAccount.user})`);
  }
}
