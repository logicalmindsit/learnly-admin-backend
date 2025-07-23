import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

/**
 * Nodemailer transporter config
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Convert role key to human-readable display text
 */
const getRoleDisplayName = (role) => {
  const roleMap = {
    superadmin: "Super Admin",
    admin: "Admin",
    boscontroller: "BOS Controller",
    bosmembers: "BOS Member",
    datamaintenance: "Data Maintenance",
    coursecontroller: "Course Controller",
    markettingcontroller: "Marketing Controller",
  };
  return roleMap[role] || role;
};

/**
 * Email HTML template
 */
const EmailTemplates = {
  adminWelcome: (user) => {
    const isBOS = user.role === "bosmembers" || user.role === "boscontroller";
    const joiningDateFormatted =
      isBOS && user.bosDetails?.joining_date
        ? new Date(user.bosDetails.joining_date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #fff; border-radius: 8px;
            overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #2D2F31; color: #ffffff; padding: 20px; text-align: center; }
          .content { padding: 20px; color: #2D2F31; }
          .footer { background-color: #f5f5f5; text-align: center; padding: 10px; font-size: 12px; color: #666; }
          .highlight { color: #A435F0; font-weight: bold; }
          ul { list-style: none; padding: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Your Learning Panel Member!</h1>
          </div>
          <div class="content">
            <h2>Hello, ${user.name}!</h2>
            <p>We are excited to welcome you as a part of our team.</p>
            <h3>Account Details</h3>
            <ul>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Mobile:</strong> ${user.mobilenumber}</li>
              <li><strong>Assigned Role:</strong> <span class="highlight">${getRoleDisplayName(user.role)}</span></li>
              ${
                isBOS
                  ? `
                    <li><strong>Member ID:</strong> ${user.bosDetails?.member_id || "N/A"}</li>
                    <li><strong>Joining Date:</strong> ${joiningDateFormatted || "N/A"}</li>
                  `
                  : ""
              }
            </ul>
            <p>As a <strong>${getRoleDisplayName(user.role)}</strong>, you now have access to manage features tailored for your role.</p>
            <p>Let’s build something amazing together!</p>
          </div>
          <div class="footer">
            <p>Thanks again and welcome aboard!<br/>The Your Learning Panel Team</p>
            <p>Contact us: <a href="mailto:support@example.com">support@example.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};

/**
 * Send welcome email using transporter
 */
export const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: `"Your Learning Panel" <${process.env.EMAIL_ADMIN}>`,
    to: user.email,
    subject: "Welcome to Your Learning Panel Member!",
    html: EmailTemplates.adminWelcome(user),
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send admin removal email
 */
const removeAdminTemplate = (user) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; background-color: #f5f5f5; color: #2d2f31; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 30px auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .header { background-color: #d32f2f; color: #fff; padding: 15px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { padding: 20px; }
      .footer { font-size: 12px; color: #888; text-align: center; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Admin Account Removed</h2>
      </div>
      <div class="content">
        <p>Hello ${user.name},</p>
        <p>We wanted to let you know that your admin access has been revoked and your account has been removed from our system.</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Role:</strong> ${getRoleDisplayName(user.role)}</li>
        </ul>
        <p>If you believe this was a mistake or you need assistance, please contact support.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Your Learning Panel. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Send removal email to deleted admin
 */
export const sendRemoveAdminEmail = async (user) => {
  const mailOptions = {
    from: `"Your Learning Panel" <${process.env.EMAIL_ADMIN}>`,
    to: user.email,
    subject: "Your Admin Account Has Been Removed",
    html: removeAdminTemplate(user),
  };

  await transporter.sendMail(mailOptions);
};
