import nodemailer from 'nodemailer';
import { logger, errorLogger } from './logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      const emailConfig = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      };

      this.transporter = nodemailer.createTransport(emailConfig);

      // Verify connection configuration
      if (process.env.NODE_ENV !== 'test') {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      }
    } catch (error) {
      errorLogger.email(error, { context: 'email_service_initialization' });
      
      // In development, use test account
      if (process.env.NODE_ENV === 'development') {
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          logger.info('Using Ethereal test account for email service');
        } catch (testError) {
          errorLogger.email(testError, { context: 'email_test_account_creation' });
        }
      }
    }
  }

  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    const emailOptions = {
      from: `${process.env.APP_NAME || 'Vibe Code'} <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    try {
      const info = await this.transporter.sendMail(emailOptions);
      
      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId
      });

      // In development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info(`Email preview: ${previewUrl}`);
        }
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' 
          ? nodemailer.getTestMessageUrl(info) 
          : null
      };
    } catch (error) {
      errorLogger.email(error, { 
        context: 'send_email',
        to: options.to,
        subject: options.subject
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Email verification
  async sendVerificationEmail(email, token, firstName = '') {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = this.generateVerificationEmailTemplate(verificationUrl, firstName);
    const text = `
      Welcome to ${process.env.APP_NAME || 'Vibe Code'}!
      
      Please verify your email address by clicking the link below:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: `Welcome to ${process.env.APP_NAME || 'Vibe Code'} - Please verify your email`,
      html,
      text
    });
  }

  // OTP email
  async sendOTPEmail(email, otp, firstName = '', type = 'verification') {
    const html = this.generateOTPEmailTemplate(otp, firstName, type);
    const text = `
      ${type === 'verification' ? 'Email Verification' : 'Login'} Code: ${otp}
      
      Hi${firstName ? ` ${firstName}` : ''},
      
      Your ${type} code is: ${otp}
      
      This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.
      
      If you didn't request this code, please ignore this email.
    `;

    const subject = type === 'verification' 
      ? `Your ${process.env.APP_NAME || 'Vibe Code'} verification code: ${otp}`
      : `Your ${process.env.APP_NAME || 'Vibe Code'} login code: ${otp}`;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  // Password reset email
  async sendPasswordResetEmail(email, token, firstName = '') {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = this.generatePasswordResetEmailTemplate(resetUrl, firstName);
    const text = `
      Password Reset Request
      
      Hi${firstName ? ` ${firstName}` : ''},
      
      You requested to reset your password. Click the link below to set a new password:
      ${resetUrl}
      
      This link will expire in ${process.env.PASSWORD_RESET_EXPIRY_MINUTES || 30} minutes.
      
      If you didn't request this reset, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject: `Reset your ${process.env.APP_NAME || 'Vibe Code'} password`,
      html,
      text
    });
  }

  // Welcome email after successful verification
  async sendWelcomeEmail(email, firstName = '') {
    const html = this.generateWelcomeEmailTemplate(firstName);
    const text = `
      Welcome to ${process.env.APP_NAME || 'Vibe Code'}!
      
      Hi${firstName ? ` ${firstName}` : ''},
      
      Your account has been successfully verified. You can now access all features of our platform.
      
      Get started: ${process.env.FRONTEND_URL}/dashboard
      
      Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@vibecore.com'}
    `;

    return await this.sendEmail({
      to: email,
      subject: `Welcome to ${process.env.APP_NAME || 'Vibe Code'}!`,
      html,
      text
    });
  }

  // Email templates
  generateVerificationEmailTemplate(verificationUrl, firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 2px; }
          .content { padding: 40px 20px; }
          .title { color: #1a1a1a; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
          .text { color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 500; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'VIBE CODE'}</div>
          </div>
          <div class="content">
            <h1 class="title">${firstName ? `Welcome, ${firstName}!` : 'Welcome!'}</h1>
            <p class="text">
              Thank you for joining ${process.env.APP_NAME || 'Vibe Code'}. To complete your registration and start using our platform, please verify your email address by clicking the button below.
            </p>
            <p style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p class="text">
              This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Vibe Code Inc'}. All rights reserved.</p>
            <p>If you need help, contact us at ${process.env.SUPPORT_EMAIL || 'support@vibecore.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateOTPEmailTemplate(otp, firstName, type) {
    const title = type === 'verification' ? 'Verify Your Email' : 'Your Login Code';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 2px; }
          .content { padding: 40px 20px; text-align: center; }
          .title { color: #1a1a1a; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
          .text { color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .otp-code { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; font-size: 32px; font-weight: bold; padding: 20px 40px; border-radius: 12px; display: inline-block; letter-spacing: 8px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'VIBE CODE'}</div>
          </div>
          <div class="content">
            <h1 class="title">${title}</h1>
            <p class="text">
              Hi${firstName ? ` ${firstName}` : ''},<br>
              Your ${type} code is:
            </p>
            <div class="otp-code">${otp}</div>
            <p class="text">
              This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.<br>
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Vibe Code Inc'}. All rights reserved.</p>
            <p>If you need help, contact us at ${process.env.SUPPORT_EMAIL || 'support@vibecore.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generatePasswordResetEmailTemplate(resetUrl, firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 2px; }
          .content { padding: 40px 20px; }
          .title { color: #1a1a1a; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
          .text { color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 500; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'VIBE CODE'}</div>
          </div>
          <div class="content">
            <h1 class="title">Reset Your Password</h1>
            <p class="text">
              Hi${firstName ? ` ${firstName}` : ''},<br><br>
              You requested to reset your password for your ${process.env.APP_NAME || 'Vibe Code'} account. Click the button below to set a new password.
            </p>
            <p style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p class="text">
              This link will expire in ${process.env.PASSWORD_RESET_EXPIRY_MINUTES || 30} minutes. If you didn't request this reset, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Vibe Code Inc'}. All rights reserved.</p>
            <p>If you need help, contact us at ${process.env.SUPPORT_EMAIL || 'support@vibecore.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateWelcomeEmailTemplate(firstName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${process.env.APP_NAME || 'Vibe Code'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 2px; }
          .content { padding: 40px 20px; }
          .title { color: #1a1a1a; font-size: 28px; font-weight: 300; margin-bottom: 20px; }
          .text { color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 500; transition: transform 0.2s; }
          .button:hover { transform: translateY(-2px); }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'VIBE CODE'}</div>
          </div>
          <div class="content">
            <h1 class="title">Welcome to ${process.env.APP_NAME || 'Vibe Code'}!</h1>
            <p class="text">
              Hi${firstName ? ` ${firstName}` : ''},<br><br>
              Your account has been successfully verified! You're now ready to explore all the features of our platform and take your business to the next level.
            </p>
            <p style="text-align: center; margin: 40px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            </p>
            <p class="text">
              If you have any questions or need assistance, don't hesitate to reach out to our support team.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Vibe Code Inc'}. All rights reserved.</p>
            <p>If you need help, contact us at ${process.env.SUPPORT_EMAIL || 'support@vibecore.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService(); 