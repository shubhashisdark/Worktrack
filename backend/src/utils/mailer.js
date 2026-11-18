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

  await activeTransporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, mode: 'smtp' };
}
