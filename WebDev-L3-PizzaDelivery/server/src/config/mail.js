import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

export const initMailer = async () => {
  if (transporter) return transporter;

  // 1. If explicit SMTP credentials are provided
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    console.log(`[MAIL] Configured standard SMTP transporter (${env.SMTP_HOST}:${env.SMTP_PORT})`);
    return transporter;
  }

  // 2. Local development fallback: Ethereal test account or console mock
  if (env.NODE_ENV === 'development') {
    try {
      console.log('[MAIL] No SMTP credentials provided. Creating ephemeral Ethereal test account for dev...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[MAIL] Ethereal dev email transporter ready. User: ${testAccount.user}`);
      return transporter;
    } catch (err) {
      console.warn('[MAIL] Failed to create Ethereal account. Using JSON console mail fallback:', err.message);
    }
  }

  // 3. Fallback transporter that logs to console
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n================== [MOCK EMAIL DELIVERED] ==================');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`From: ${mailOptions.from || env.EMAIL_FROM}`);
      console.log('Preview/Text Content:');
      console.log(mailOptions.text || '(HTML Only)');
      console.log('============================================================\n');
      return { messageId: `mock-${Date.now()}` };
    },
  };
  console.log('[MAIL] Mock console mail transporter initialized.');
  return transporter;
};

export const getMailer = () => transporter;
