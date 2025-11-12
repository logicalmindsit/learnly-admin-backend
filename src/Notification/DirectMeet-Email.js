import nodemailer from "nodemailer";
import dotenv from "dotenv";
import User from "../Models/User/User-Model.js";

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
 * DirectMeet notification email template
 */
const directMeetEmailTemplate = (user, directMeet) => {
  const applyStartDate = new Date(directMeet.apply_meet_start_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  
  const applyEndDate = new Date(directMeet.apply_meet_end_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  
  const conductDate = new Date(directMeet.meet_conduct_from_date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New DirectMeet Announcement</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 10px;
        }
        .title {
          color: #007bff;
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        .meet-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #007bff;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e9ecef;
        }
        .detail-label {
          font-weight: bold;
          color: #495057;
          flex: 1;
        }
        .detail-value {
          flex: 2;
          color: #212529;
        }
        .fees {
          font-size: 18px;
          font-weight: bold;
          color: #28a745;
        }
        .cta-button {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 14px;
        }
        .important-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">schoolemy</div>
          <p>Educational Institute</p>
        </div>

        <h2 class="title">🎯 New DirectMeet Opportunity!</h2>

        <p>Dear ${user.username || 'Student'},</p>

        <p>We are excited to announce a new DirectMeet opportunity that might interest you. Here are the details:</p>

        <div class="meet-details">
          <div class="detail-row">
            <span class="detail-label">Meet ID:</span>
            <span class="detail-value"><strong>${directMeet.meet_id}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Title:</span>
            <span class="detail-value"><strong>${directMeet.meet_title}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description:</span>
            <span class="detail-value">${directMeet.description}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Application Period:</span>
            <span class="detail-value">${applyStartDate} to ${applyEndDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Meet Date:</span>
            <span class="detail-value">${conductDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Fees:</span>
            <span class="detail-value fees">₹${directMeet.fees}</span>
          </div>
        </div>

        <div class="important-note">
          <strong>📅 Important:</strong> Applications are open from <strong>${applyStartDate}</strong> to <strong>${applyEndDate}</strong>. Don't miss this opportunity!
        </div>

        <div style="text-align: center;">
          <a href="#" class="cta-button">Apply Now</a>
        </div>

        <p>If you have any questions or need assistance with your application, please don't hesitate to contact our support team.</p>

        <div class="footer">
          <p><strong>Best regards,</strong><br>
          The schoolemy Team</p>
          <hr style="margin: 20px 0;">
          <p>© 2025 schoolemy Educational Institute. All Rights Reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send DirectMeet notification to a single user
 */
export const sendDirectMeetNotificationEmail = async (userEmail, user, directMeet) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_ADMIN,
      to: userEmail,
      subject: `🎯 New DirectMeet: ${directMeet.meet_title} - Apply Now!`,
      html: directMeetEmailTemplate(user, directMeet),
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error(`Error sending DirectMeet notification to ${userEmail}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Send DirectMeet notification to all users
 */
export const sendDirectMeetNotificationToAllUsers = async (directMeet) => {
  try {
    console.log("Starting to send DirectMeet notifications to all users...");
    
    // Get all users with valid email addresses
    const users = await User.find({ 
      email: { $exists: true, $ne: null, $ne: "" },
      role: "user" // Only send to regular users, not admins
    }).select("email username");

    if (!users || users.length === 0) {
      console.log("No users found with valid email addresses");
      return { 
        success: true, 
        message: "No users found to send notifications to",
        totalUsers: 0,
        successCount: 0,
        failureCount: 0
      };
    }

    console.log(`Found ${users.length} users to notify`);

    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    // Send emails in batches to avoid overwhelming the email service
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const promises = batch.map(async (user) => {
        try {
          const result = await sendDirectMeetNotificationEmail(user.email, user, directMeet);
          if (result.success) {
            successCount++;
            console.log(`✅ Email sent successfully to: ${user.email}`);
          } else {
            failureCount++;
            failures.push({ email: user.email, error: result.error });
            console.error(`❌ Failed to send email to: ${user.email} - ${result.error}`);
          }
        } catch (error) {
          failureCount++;
          failures.push({ email: user.email, error: error.message });
          console.error(`❌ Failed to send email to: ${user.email} - ${error.message}`);
        }
      });

      await Promise.all(promises);
      
      // Add a small delay between batches to be respectful to the email service
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`DirectMeet notification sending completed. Success: ${successCount}, Failures: ${failureCount}`);

    return {
      success: true,
      message: `DirectMeet notifications sent successfully`,
      totalUsers: users.length,
      successCount,
      failureCount,
      failures: failures.length > 0 ? failures : undefined
    };

  } catch (error) {
    console.error("Error in sendDirectMeetNotificationToAllUsers:", error);
    return {
      success: false,
      message: "Failed to send DirectMeet notifications",
      error: error.message
    };
  }
};

export default {
  sendDirectMeetNotificationEmail,
  sendDirectMeetNotificationToAllUsers
};
