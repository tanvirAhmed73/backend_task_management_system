import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type {
  TaskAssignedEmailJobData,
  TaskCompletedEmailJobData,
  WelcomeEmailJobData,
} from './mail.types';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(inner: string, preheader: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(preheader)}</title>
</head>
<body style="margin:0;background:#f4f6f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(15,23,42,.08);overflow:hidden;">
          ${inner}
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Task Management System</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private get isSmtpConfigured(): boolean {
    const host = this.config.get<string>('mail.host');
    return Boolean(host?.trim());
  }

  private getTransporter(): Transporter | null {
    if (!this.isSmtpConfigured) return null;
    if (this.transporter) return this.transporter;
    const user = this.config.get<string>('mail.user') ?? '';
    const pass = this.config.get<string>('mail.pass') ?? '';
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure'),
      ...(user.trim() && pass.trim()
        ? { auth: { user: user.trim(), pass: pass.trim() } }
        : {}),
    });
    return this.transporter;
  }

  async sendWelcomeEmail(data: WelcomeEmailJobData): Promise<void> {
    const from = this.config.get<string>('mail.from') ?? '';
    const loginUrl = this.config.get<string>('mail.frontendLoginUrl') || '#';
    const greeting = data.recipientName?.trim()
      ? `Hi ${escapeHtml(data.recipientName.trim())},`
      : 'Hello,';

    const inner = `
          <tr>
            <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:600;">Your account is ready</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;color:#334155;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">${greeting}</p>
              <p style="margin:0 0 16px;">An administrator created an account for you. Use the credentials below to sign in, then change your password from your profile.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;background:#f1f5f9;border-radius:8px;margin:16px 0;">
                <tr><td style="padding:16px 18px;">
                  <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;">Login email</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;word-break:break-all;">${escapeHtml(data.loginEmail)}</p>
                  <p style="margin:16px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;">Temporary password</p>
                  <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;font-family:ui-monospace,monospace;letter-spacing:.02em;">${escapeHtml(data.temporaryPassword)}</p>
                </td></tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Invited by ${escapeHtml(data.invitedByName?.trim() || data.invitedByEmail)} (${escapeHtml(data.invitedByEmail)})</p>
              <p style="margin:20px 0 0;">
                <a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Open sign-in</a>
              </p>
            </td>
          </tr>`;

    const html = layout(inner, 'Your account credentials');
    await this.sendRaw({
      to: data.toEmail,
      subject: 'Your Task Management login',
      html,
      from,
    });
  }

  async sendTaskAssignedEmail(data: TaskAssignedEmailJobData): Promise<void> {
    const from = this.config.get<string>('mail.from') ?? '';
    const assignerLabel = escapeHtml(
      data.assignerName?.trim() || data.assignerEmail,
    );
    const greeting = data.recipientName?.trim()
      ? `Hi ${escapeHtml(data.recipientName.trim())},`
      : 'Hello,';
    const title = escapeHtml(data.taskTitle);
    const status = escapeHtml(data.taskStatus);

    const inner = `
          <tr>
            <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#0f766e 0%,#14b8a6 100%);">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:600;">New task assigned to you</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;color:#334155;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">${greeting}</p>
              <p style="margin:0 0 16px;"><strong>${assignerLabel}</strong> assigned you a task.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;margin:16px 0;">
                <tr><td style="padding:18px 20px;">
                  <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#0d9488;">Task</p>
                  <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#134e4a;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#475569;">Status: <strong>${status}</strong></p>
                  <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">ID: ${escapeHtml(data.taskId)}</p>
                </td></tr>
              </table>
              <p style="margin:0;font-size:13px;color:#64748b;">Open your Task Management app to view details and update progress.</p>
            </td>
          </tr>`;

    const html = layout(inner, `Assigned: ${data.taskTitle}`);
    await this.sendRaw({
      to: data.toEmail,
      subject: `Assigned: ${data.taskTitle}`,
      html,
      from,
    });
  }

  async sendTaskCompletedEmail(data: TaskCompletedEmailJobData): Promise<void> {
    const from = this.config.get<string>('mail.from') ?? '';
    const who = escapeHtml(
      data.completedByName?.trim() || data.completedByEmail,
    );
    const greeting = data.adminRecipientName?.trim()
      ? `Hi ${escapeHtml(data.adminRecipientName.trim())},`
      : 'Hello,';
    const title = escapeHtml(data.taskTitle);

    const inner = `
          <tr>
            <td style="padding:28px 28px 8px;background:linear-gradient(135deg,#1e40af 0%,#6366f1 100%);">
              <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:600;">Task completed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;color:#334155;font-size:15px;line-height:1.6;">
              <p style="margin:0 0 16px;">${greeting}</p>
              <p style="margin:0 0 16px;"><strong>${who}</strong> marked a task as <strong>Done</strong>.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;margin:16px 0;">
                <tr><td style="padding:18px 20px;">
                  <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#4338ca;">Task</p>
                  <p style="margin:0 0 12px;font-size:18px;font-weight:600;color:#312e81;">${title}</p>
                  <p style="margin:0;font-size:13px;color:#475569;">Status: <strong>DONE</strong></p>
                  <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">ID: ${escapeHtml(data.taskId)}</p>
                </td></tr>
              </table>
            </td>
          </tr>`;

    const html = layout(inner, `Completed: ${data.taskTitle}`);
    await this.sendRaw({
      to: data.toEmail,
      subject: `Completed: ${data.taskTitle}`,
      html,
      from,
    });
  }

  private async sendRaw(opts: {
    to: string;
    from: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const transport = this.getTransporter();
    if (!transport) {
      this.logger.warn(
        `SMTP not configured (set SMTP_HOST, etc.); skipping email to ${opts.to}: ${opts.subject}`,
      );
      return;
    }
    try {
      await transport.sendMail({
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      this.logger.log(`Sent mail: "${opts.subject}" → ${opts.to}`);
    } catch (err) {
      this.logger.error(
        `Failed to send mail to ${opts.to}: ${err instanceof Error ? err.message : err}`,
      );
      throw err;
    }
  }
}
