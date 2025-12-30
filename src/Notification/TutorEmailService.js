import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Check if email credentials are configured
const isEmailConfigured = process.env.EMAIL_ADMIN && process.env.EMAIL_PASS;

let transporter = null;

if (isEmailConfigured) {
  // Remove spaces from app password (Gmail app passwords sometimes have spaces)
  const cleanPassword = process.env.EMAIL_PASS.replace(/\s+/g, '');
  
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Use port 587 (TLS) instead of 465 (SSL) - more reliable
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_ADMIN,
      pass: cleanPassword,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  // Verify connection configuration (disabled for serverless)
  // transporter.verify(function (error, success) {
  //   if (error) {
  //     console.error("❌ Email transporter verification failed:", error);
  //     console.error("❌ Please check your EMAIL_ADMIN and EMAIL_PASS in .env file");
  //   } 
  // });
} else {
  console.warn("⚠️  Email credentials not configured. Email notifications will be disabled.");
  console.warn("⚠️  Set EMAIL_ADMIN and EMAIL_PASS in .env file to enable email functionality.");
}

/**
 * Send tutor credentials email after registration
 */
export const sendTutorCredentialsEmail = async (email, name, loginEmail, password) => {
  // Check if email service is configured
  if (!isEmailConfigured || !transporter) {
    console.log("📧 Email service not configured - skipping email send");
    return {
      success: false,
      message: "Email service not configured. Please set EMAIL_ADMIN and EMAIL_PASS in .env file."
    };
  }

  try {
    const loginUrl = process.env.FRONTEND_URL || "https://schoolemyadmin.schoolemy.com/";

    await transporter.sendMail({
      from: `"schoolemy Platform" <${process.env.EMAIL_ADMIN}>`,
      to: email,
      subject: "Welcome to schoolemy - Your Tutor Account Credentials",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px 20px;
            }
            .credentials-box {
              background-color: #f8f9fa;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .credential-row {
              display: flex;
              margin: 10px 0;
              padding: 8px 0;
            }
            .credential-label {
              font-weight: bold;
              color: #555;
              width: 120px;
            }
            .credential-value {
              color: #333;
              font-family: 'Courier New', monospace;
              background-color: #fff;
              padding: 5px 10px;
              border-radius: 4px;
              flex: 1;
              font-size: 16px;
              font-weight: bold;
            }
            .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              text-decoration: none;
              padding: 14px 32px;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
              font-size: 16px;
            }
            .login-button:hover {
              background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }
            .important-note {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .steps-box {
              background-color: #e7f3ff;
              border-left: 4px solid #2196F3;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .steps-box ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .steps-box li {
              margin: 10px 0;
              color: #1976D2;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            .divider {
              height: 1px;
              background-color: #e0e0e0;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Welcome to schoolemy</h1>
              <p style="margin: 10px 0 0 0;">Your Tutor Account is Ready!</p>
            </div>
            
            <div class="content">
              <h2 style="color: #667eea;">Hello ${name},</h2>
              
              <p>Congratulations! Your registration as a tutor on schoolemy has been successfully completed. We're excited to have you join our educational community.</p>
              
              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #667eea;">� Your Login Credentials</h3>
                <div class="credential-row">
                  <span class="credential-label">Email:</span>
                  <span class="credential-value">${loginEmail}</span>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Password:</span>
                  <span class="credential-value">${password}</span>
                </div>
              </div>

              <div class="steps-box">
                <h3 style="margin-top: 0; color: #2196F3;">📋 How to Login:</h3>
                <ol>
                  <li>Go to the login page by clicking the button below</li>
                  <li>Enter your email: <strong>${loginEmail}</strong></li>
                  <li>Enter your password: <strong>${password}</strong></li>
                  <li>Click "Sign In" button</li>
                  <li>You'll be redirected to your tutor dashboard</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}" class="login-button">🚀 Login to Your Dashboard</a>
              </div>
              
              <div class="important-note">
                <strong>⚠️ Important Security Note:</strong>
                <p style="margin: 10px 0 0 0;">
                  For security reasons, we strongly recommend changing your password after your first login. 
                  You can do this from your tutor dashboard settings.
                </p>
              </div>
              
              <div class="divider"></div>
              
              <h3 style="color: #667eea;">What's Next?</h3>
              <ul style="line-height: 1.8;">
                <li>✅ Log in to your tutor dashboard</li>
                <li>✅ Complete your profile information</li>
                <li>✅ Upload your courses and materials</li>
                <li>✅ Start connecting with students</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The schoolemy Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">© ${new Date().getFullYear()} schoolemy. All Rights Reserved.</p>
              <p style="margin: 10px 0 0 0;">This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, message: "Credentials email sent successfully" };
  } catch (error) {
    console.error("❌ Error sending credentials email:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return {
      success: false,
      message: "Error sending credentials email",
      error: error.message,
      errorCode: error.code,
    };
  }
};

/**
 * Send tutor welcome email without credentials
 */
export const sendTutorWelcomeEmail = async (email, name) => {
  try {
    await transporter.sendMail({
      from: `"schoolemy Platform" <${process.env.EMAIL_ADMIN}>`,
      to: email,
      subject: "Welcome to schoolemy Tutor Community",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #667eea; text-align: center;">Welcome to schoolemy!</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering as a tutor with schoolemy. We're thrilled to have you join our educational community!</p>
          <p>Your account has been created successfully. You will receive a separate email with your login credentials shortly.</p>
          <p>We look forward to having you share your knowledge and expertise with our students.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} schoolemy. All Rights Reserved.</p>
        </div>
      `,
    });

    return { success: true, message: "Welcome email sent successfully" };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return {
      success: false,
      message: "Error sending welcome email",
      error: error.message,
    };
  }
};

export default transporter;
