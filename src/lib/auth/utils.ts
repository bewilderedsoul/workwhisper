// src/lib/auth/utils.ts
import crypto from "crypto";
import nodemailer from "nodemailer";

// Anonymous username generator
const adjectives = [
  "Silent", "Quiet", "Anonymous", "Hidden", "Ghost", "Shadow", "Veiled",
  "Brave", "Swift", "Calm", "Clear", "Bold", "Wise", "Sharp", "Keen",
  "Bright", "Dark", "Iron", "Steel", "Silver", "Golden", "Humble",
  "Curious", "Restless", "Wandering", "Focused", "Driven", "Steady",
];

const nouns = [
  "Coder", "Dev", "Architect", "Builder", "Engineer", "Hacker", "Maker",
  "Thinker", "Solver", "Navigator", "Explorer", "Pioneer", "Creator",
  "Analyst", "Debugger", "Deployer", "Committer", "Pusher", "Merger",
  "Reviewer", "Scaler", "Optimizer", "Refactorer", "Shipper",
];

export function generateUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your WorkWhisper login code",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui, sans-serif; background: #0a0a0a; color: #fff; padding: 40px 20px; text-align: center;">
          <div style="max-width: 400px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 16px; padding: 40px;">
            <div style="font-size: 32px; margin-bottom: 8px;">🤫</div>
            <h1 style="font-size: 22px; margin: 0 0 8px; color: #fff;">WorkWhisper</h1>
            <p style="color: #888; margin: 0 0 32px; font-size: 14px;">Your anonymous community</p>
            <p style="color: #aaa; margin: 0 0 16px;">Your one-time login code:</p>
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #c445ed; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes. Do not share it.</p>
          </div>
        </body>
      </html>
    `,
  });
}
