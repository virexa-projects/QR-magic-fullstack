// utils/email.service.ts
import nodemailer from "nodemailer";
import { env } from "@config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  await transporter.sendMail({
    from: env.MAIL_FROM, // e.g. '"QRBharat" <no-reply@qrbharat.in>'
    to,
    subject: "Verify your email address",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Hi ${name},</h2>
        <p>Thanks for signing up. Please confirm your email address to activate your account:</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background:#000099;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
            Verify Email
          </a>
        </p>
        <p style="color:#666;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
        <p style="color:#999;font-size:12px;">If the button doesn't work, copy and paste this link: <br/>${verifyUrl}</p>
      </div>
    `,
  });
}