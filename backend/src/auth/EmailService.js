const crypto = require('crypto');
const nodemailer = require('nodemailer');

class EmailService {
  constructor(dbPool) {
    this.db = dbPool;
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Initialize email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development - use Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
    }
  }

  // ==============================================
  // EMAIL VERIFICATION
  // ==============================================

  async sendVerificationEmail(userId, email) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Generate verification token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store verification token
      await client.query(
        `
        INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
        VALUES ($1, $2, 'email_verification', $3)
      `,
        [userId, tokenHash, expiresAt],
      );

      // Create verification URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

      // Send email
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@jewgo.app',
        to: email,
        subject: 'Verify your Jewgo account',
        html: this.getVerificationEmailTemplate(verificationUrl),
        text: this.getVerificationEmailText(verificationUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);

      await client.query('COMMIT');

      // Log email sent event
      await this.logEmailEvent(userId, 'verification_email_sent', true, {
        email,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.getTestMessageUrl
          ? result.getTestMessageUrl()
          : null,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      // Log email failure
      await this.logEmailEvent(userId, 'verification_email_failed', false, {
        email,
        error: error.message,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  async verifyEmailToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Find and validate token
      const result = await client.query(
        `
        SELECT vt.user_id, vt.expires_at, u.primary_email, u.status
        FROM verification_tokens vt
        JOIN users u ON vt.user_id = u.id
        WHERE vt.token_hash = $1 
          AND vt.purpose = 'email_verification'
          AND vt.expires_at > NOW() 
          AND vt.used_at IS NULL
      `,
        [tokenHash],
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid or expired verification token');
      }

      const { user_id, primary_email } = result.rows[0];

      // Mark token as used
      await client.query(
        `
        UPDATE verification_tokens 
        SET used_at = NOW() 
        WHERE token_hash = $1
      `,
        [tokenHash],
      );

      // Update user status to active
      await client.query(
        `
        UPDATE users 
        SET status = 'active', updated_at = NOW()
        WHERE id = $1
      `,
        [user_id],
      );

      await client.query('COMMIT');

      // Log verification event
      await this.logEmailEvent(user_id, 'email_verified', true, {
        email: primary_email,
      });

      return {
        success: true,
        userId: user_id,
        email: primary_email,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // PASSWORD RESET EMAILS
  // ==============================================

  async sendPasswordResetEmail(userId, email) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await client.query(
        `
        INSERT INTO verification_tokens (user_id, token_hash, purpose, expires_at)
        VALUES ($1, $2, 'password_reset', $3)
      `,
        [userId, tokenHash, expiresAt],
      );

      // Create reset URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      // Send email
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@jewgo.app',
        to: email,
        subject: 'Reset your Jewgo password',
        html: this.getPasswordResetEmailTemplate(resetUrl),
        text: this.getPasswordResetEmailText(resetUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);

      await client.query('COMMIT');

      // Log email sent event
      await this.logEmailEvent(userId, 'password_reset_email_sent', true, {
        email,
        messageId: result.messageId,
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.getTestMessageUrl
          ? result.getTestMessageUrl()
          : null,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      // Log email failure
      await this.logEmailEvent(userId, 'password_reset_email_failed', false, {
        email,
        error: error.message,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  async verifyPasswordResetToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await this.db.query(
      `
      SELECT vt.user_id, vt.expires_at, u.primary_email
      FROM verification_tokens vt
      JOIN users u ON vt.user_id = u.id
      WHERE vt.token_hash = $1 
        AND vt.purpose = 'password_reset'
        AND vt.expires_at > NOW() 
        AND vt.used_at IS NULL
    `,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired password reset token');
    }

    return {
      success: true,
      userId: result.rows[0].user_id,
      email: result.rows[0].primary_email,
    };
  }

  async markPasswordResetTokenUsed(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.db.query(
      `
      UPDATE verification_tokens 
      SET used_at = NOW() 
      WHERE token_hash = $1 AND purpose = 'password_reset'
    `,
      [tokenHash],
    );
  }

  // ==============================================
  // EMAIL TEMPLATES
  // ==============================================

  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your Jewgo account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Jewgo!</h1>
          </div>
          <div class="content">
            <h2>Verify your email address</h2>
            <p>Thank you for signing up for Jewgo! To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Jewgo, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Jewgo. All rights reserved.</p>
            <p>This email was sent to you because you signed up for a Jewgo account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getVerificationEmailText(verificationUrl) {
    return `
Welcome to Jewgo!

Thank you for signing up for Jewgo! To complete your registration and start using your account, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Jewgo, you can safely ignore this email.

© 2024 Jewgo. All rights reserved.
    `;
  }

  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your Jewgo password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { 
            display: inline-block; 
            background-color: #dc3545; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 4px; 
            margin: 20px 0;
          }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password for your Jewgo account. If you made this request, click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This password reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          </div>
          <div class="footer">
            <p>© 2024 Jewgo. All rights reserved.</p>
            <p>This email was sent to you because a password reset was requested for your Jewgo account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailText(resetUrl) {
    return `
Password Reset Request

We received a request to reset your password for your Jewgo account. If you made this request, visit this link to reset your password:

${resetUrl}

This password reset link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

© 2024 Jewgo. All rights reserved.
    `;
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  async logEmailEvent(userId, event, success, details = {}) {
    try {
      await this.db.query(
        `
        INSERT INTO auth_events (user_id, event, success, details)
        VALUES ($1, $2, $3, $4)
      `,
        [userId, event, success, JSON.stringify(details)],
      );
    } catch (error) {
      console.error('Failed to log email event:', error);
    }
  }

  async cleanupExpiredTokens() {
    const result = await this.db.query(`
      DELETE FROM verification_tokens 
      WHERE expires_at < NOW() AND used_at IS NULL
      RETURNING COUNT(*) as deleted_count
    `);

    return result.rows[0]?.deleted_count || 0;
  }

  async getEmailStats(timeWindow = '24 hours') {
    const result = await this.db.query(`
      SELECT 
        event,
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE success = true) as successful_emails,
        COUNT(*) FILTER (WHERE success = false) as failed_emails
      FROM auth_events
      WHERE event LIKE '%email%' 
        AND created_at > NOW() - INTERVAL '${timeWindow}'
      GROUP BY event
      ORDER BY total_emails DESC
    `);

    return result.rows;
  }
}

module.exports = EmailService;
