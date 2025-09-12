import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: Transporter;
  private from: string;
  private appWebUrl: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM') || 'No Reply <no-reply@example.com>';
    this.appWebUrl = this.config.get<string>('APP_WEB_URL') || 'http://localhost:4200';

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') || 587);
    const secure = String(this.config.get<string>('SMTP_SECURE') || 'false') === 'true';
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      this.logger.log(`SMTP transporter configured for ${host}:${port} (secure=${secure})`);
    } else {
      this.logger.warn('SMTP not configured. Falling back to console logging of emails.');
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
    if (!this.transporter) {
      // Dev fallback
      this.logger.log(`MAIL (dev only): to=${to} subject="${subject}"\n${text}`);
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text, html });
  }
}
