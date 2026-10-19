import nodemailer from 'nodemailer';
import { getMailer, initMailer } from '../config/mail.js';
import { env } from '../config/env.js';

/**
 * Common HTML email shell styled with PizzaVerse design tokens
 */
const getEmailTemplate = ({ title, heading, bodyHtml, ctaText, ctaUrl, footerNote }) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #F6F7ED;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #001F3F;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 31, 63, 0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #001F3F;
          padding: 32px 24px;
          text-align: center;
        }
        .brand-logo {
          font-size: 28px;
          font-weight: 800;
          color: #F6F7ED;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .brand-accent {
          color: #DBE64C;
        }
        .content {
          padding: 36px 32px;
          line-height: 1.6;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #001F3F;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .btn-container {
          margin: 32px 0;
          text-align: center;
        }
        .btn {
          display: inline-block;
          background-color: #00804C;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 16px;
          padding: 14px 32px;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(0, 128, 76, 0.25);
        }
        .btn:hover {
          background-color: #74C365;
        }
        .raw-link {
          word-break: break-all;
          color: #1E488F;
          font-size: 13px;
        }
        .footer {
          background-color: #F6F7ED;
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="${env.CLIENT_URL}" class="brand-logo">PIZZA<span class="brand-accent">VERSE</span></a>
        </div>
        <div class="content">
          <h1 class="title">${heading}</h1>
          ${bodyHtml}
          ${ctaText && ctaUrl ? `
            <div class="btn-container">
              <a href="${ctaUrl}" class="btn" target="_blank">${ctaText}</a>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
              If button doesn't work, copy and paste this link in your browser:<br>
              <a href="${ctaUrl}" class="raw-link">${ctaUrl}</a>
            </p>
          ` : ''}
          ${footerNote ? `<p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">${footerNote}</p>` : ''}
        </div>
        <div class="footer">
          <p style="margin: 0 0 8px 0;">&copy; ${new Date().getFullYear()} PizzaVerse Inc. Crafted for pizza lovers.</p>
          <p style="margin: 0;">This is an automated security transmission. If you did not make this request, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

/**
 * Send Email Verification link to newly registered user
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  let transporter = getMailer();
  if (!transporter) {
    transporter = await initMailer();
  }

  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  const html = getEmailTemplate({
    title: 'Verify your PizzaVerse account',
    heading: `Benvenuto, ${name}! 🍕`,
    bodyHtml: `
      <p>Thank you for registering at <strong>PizzaVerse</strong>, your destination for premium artisanal wood-fired pizzas.</p>
      <p>Please confirm your email address by clicking the button below. This link remains valid for <strong>24 hours</strong>.</p>
    `,
    ctaText: 'Verify Email Address',
    ctaUrl: verificationUrl,
    footerNote: 'If you did not register for a PizzaVerse account, please disregard this email.',
  });

  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject: '🍕 Verify your PizzaVerse account',
    text: `Hello ${name},\n\nPlease verify your PizzaVerse account by navigating to:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nTeam PizzaVerse`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (env.NODE_ENV === 'development') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAIL] Verification email preview URL: ${previewUrl}`);
    } else {
      console.log(`[MAIL] Dev Mode verification link: ${verificationUrl}`);
    }
  }

  return info;
};

/**
 * Send Password Reset link to user
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  let transporter = getMailer();
  if (!transporter) {
    transporter = await initMailer();
  }

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  const html = getEmailTemplate({
    title: 'Reset your PizzaVerse password',
    heading: `Hello, ${name}`,
    bodyHtml: `
      <p>We received a request to reset the password for your PizzaVerse account.</p>
      <p>Click the button below to choose a new password. This link is secure and valid for <strong>1 hour</strong>.</p>
    `,
    ctaText: 'Reset Password',
    ctaUrl: resetUrl,
    footerNote: 'If you did not request a password reset, no action is needed. Your account remains completely secure.',
  });

  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject: '🔐 Reset your PizzaVerse password',
    text: `Hello ${name},\n\nYou requested a password reset. Please visit:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not make this request, you can ignore this email.`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (env.NODE_ENV === 'development') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAIL] Password reset email preview URL: ${previewUrl}`);
    } else {
      console.log(`[MAIL] Dev Mode reset link: ${resetUrl}`);
    }
  }

  return info;
};

/**
 * Send automated low-stock alert email to administration
 */
export const sendLowStockAlertEmail = async ({
  to = env.ADMIN_NOTIFICATION_EMAIL,
  itemName,
  category,
  currentStock,
  threshold,
  unit = 'portions',
  sku,
}) => {
  let transporter = getMailer();
  if (!transporter) {
    transporter = await initMailer();
  }

  const dashboardUrl = `${env.CLIENT_URL}/admin/inventory`;

  const html = getEmailTemplate({
    title: `[ACTION REQUIRED] Low Stock Alert: ${itemName}`,
    heading: `⚠️ Low Stock Warning: ${itemName}`,
    bodyHtml: `
      <p>This is an automated inventory alert from the <strong>PizzaVerse Kitchen Management System</strong>.</p>
      <div style="background-color: #F6F7ED; border-left: 4px solid #DBE64C; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>Ingredient / Item:</strong> ${itemName} (${sku})</p>
        <p style="margin: 4px 0;"><strong>Category:</strong> ${category.replace('_', ' ').toUpperCase()}</p>
        <p style="margin: 4px 0; color: #b91c1c;"><strong>Current Available Stock:</strong> ${currentStock} ${unit}</p>
        <p style="margin: 4px 0;"><strong>Threshold Level:</strong> ${threshold} ${unit}</p>
      </div>
      <p>Stock has breached the safety threshold. Please contact your regional suppliers or place an immediate batch restock order to prevent checkout disruption.</p>
    `,
    ctaText: 'Open Inventory Management',
    ctaUrl: dashboardUrl,
    footerNote: 'PizzaVerse Automated Warehouse Monitoring Engine. To adjust thresholds, visit the Admin Control Center.',
  });

  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject: `⚠️ [LOW STOCK ALERT] ${itemName} is at ${currentStock} ${unit} (Threshold: ${threshold})`,
    text: `Low Stock Warning: ${itemName} (${sku}) is down to ${currentStock} ${unit}. Configured minimum threshold is ${threshold} ${unit}. Please restock at ${dashboardUrl}.`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  if (env.NODE_ENV === 'development') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAIL] Low-stock alert preview URL: ${previewUrl}`);
    }
  }

  return info;
};

