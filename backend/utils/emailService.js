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

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailOptions.attachments = options.attachments;
    }

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

  // Send proposal email with PDF attachment
  async sendProjectNotificationEmail({ 
    to, 
    clientName, 
    projectName, 
    message, 
    projectProgress, 
    projectStatus, 
    milestones = [], 
    publicViewLink,
    senderName 
  }) {
    const statusDisplay = projectStatus?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
    
    const milestonesHtml = milestones.length > 0 
      ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 10px;">Recent Milestones:</h3>
          ${milestones.map(milestone => `
            <div style="margin-bottom: 8px; padding: 8px; background-color: white; border-radius: 4px;">
              <strong>${milestone.title}</strong>
              <span style="color: ${milestone.status === 'completed' ? '#28a745' : milestone.status === 'overdue' ? '#dc3545' : '#ffc107'}; margin-left: 10px;">
                ${milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
              </span>
              ${milestone.dueDate ? `<div style="color: #666; font-size: 12px;">Due: ${new Date(milestone.dueDate).toLocaleDateString()}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `
      : ''

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Update - ${projectName}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">Project Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">${projectName}</p>
        </div>

        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">Hello ${clientName},</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">${message}</p>
          </div>

          <div style="margin: 30px 0;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Project Status</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
              <div style="text-align: center; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
                <h3 style="margin: 0; color: #1976d2;">Progress</h3>
                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${projectProgress || 0}%</div>
              </div>
              
              <div style="text-align: center; padding: 15px; background-color: #f3e5f5; border-radius: 8px;">
                <h3 style="margin: 0; color: #7b1fa2;">Status</h3>
                <div style="font-size: 18px; font-weight: bold; color: #7b1fa2;">${statusDisplay}</div>
              </div>
            </div>
          </div>

          ${milestonesHtml}

          ${publicViewLink ? `
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f5e8; border-radius: 8px;">
              <h3 style="color: #333; margin-bottom: 15px;">View Full Project Details</h3>
              <a href="${publicViewLink}" 
                 style="display: inline-block; background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; transition: background-color 0.3s;">
                View Project
              </a>
            </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p style="margin: 0;">Best regards,<br><strong>${senderName}</strong></p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
          <p>This is an automated notification from ${process.env.APP_NAME || 'freelancehub'}.</p>
        </div>
      </body>
      </html>
    `

    const textVersion = `
      Project Update: ${projectName}
      
      Hello ${clientName},
      
      ${message}
      
      Project Status:
      - Progress: ${projectProgress || 0}%
      - Status: ${statusDisplay}
      
      ${milestones.length > 0 ? `
      Recent Milestones:
      ${milestones.map(m => `- ${m.title} (${m.status})`).join('\n')}
      ` : ''}
      
      ${publicViewLink ? `View full project details: ${publicViewLink}` : ''}
      
      Best regards,
      ${senderName}
    `

    return this.sendEmail({
      to,
      subject: `Project Update: ${projectName}`,
      html,
      text: textVersion
    })
  }

  async sendProposalEmail({ to, subject, message, senderName, proposalNumber, pdfBuffer, pdfFileName }) {
    try {
      const mailOptions = {
        from: {
          name: senderName || process.env.APP_NAME,
          address: process.env.EMAIL_FROM
        },
        to: to,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">freelancehubr</h1>
              <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 14px;">Professional Freelance Services</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">New Proposal</h2>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #475569; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="background: #0ea5e9; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center;">
                <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px;">📎 Proposal Attached</h3>
                <p style="color: #e0f2fe; margin: 0; font-size: 14px;">Please find the detailed proposal attached as a PDF document.</p>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                  This proposal was generated using freelancehubr - Professional Freelance Management Platform
                </p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Proposal email sent successfully', {
        to: to,
        proposalNumber: proposalNumber,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Failed to send proposal email:', error);
      throw error;
    }
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