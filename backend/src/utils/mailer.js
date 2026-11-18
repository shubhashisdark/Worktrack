import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.smtp.host && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  if (env.isTest) {
    return { delivered: false, mode: 'test' };
  }

  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    console.log(`[MAILER:DEV] To: ${to} | Subject: ${subject}\n${text}`);
    return { delivered: false, mode: 'console' };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
    });
    console.log(`[MAILER:SMTP] Email sent to ${to}: ${info.messageId}`);
    return { delivered: true, messageId: info.messageId, mode: 'smtp' };
  } catch (err) {
    console.error(`[MAILER:ERROR] Failed to send email via SMTP to ${to}:`, err.message);
    console.log(`[MAILER:FALLBACK] Reset link for ${to}:\n${text}`);
    return { delivered: false, error: err.message, mode: 'failed' };
  }
}
