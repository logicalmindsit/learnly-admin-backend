import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMeetingEmail = async (emails, meeting) => {
  const formattedDate = new Date(meeting.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = meeting.time;
  const meetingId = meeting.meeting_id;

  const mailOptions = {
    from: `"Board of Studies (BOS)" <${process.env.EMAIL_ADMIN}>`,
    to: emails.join(','),
    subject: `BOS Meeting Invitation: ${meeting.title} [${meetingId}]`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2c3e50; line-height: 1.6;">
        <!-- Header with Logo and Border -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #3498db;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Board of Studies Meeting</h1>
          <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 16px;">Official Meeting Invitation</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px; background-color: #ffffff;">
          <!-- Meeting Title -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin: 0; font-size: 20px; font-weight: 600;">${meeting.title}</h2>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">Reference: ${meetingId}</p>
          </div>
          
          <!-- Meeting Details Card -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #3498db;">📅 Date</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${formattedDate}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #3498db;">🕒 Time</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${formattedTime}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #3498db;">📍 Location</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${meeting.location || 'To be determined'}</strong>
                </td>
              </tr>
              ${meeting.plateform_link ? `
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #3498db;">🔗 Virtual Meeting</span>
                </td>
                <td style="padding: 8px 0;">
                  <a href="${meeting.plateform_link}" style="color: #3498db; text-decoration: none; font-weight: 600;">Join Meeting</a>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Agenda Section -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e9ecef;">
              Meeting Agenda
            </h3>
            <div style="background-color: #ffffff; padding: 15px; border-left: 3px solid #3498db;">
              ${meeting.agenda ? `
                <div style="white-space: pre-line;">${meeting.agenda}</div>
              ` : 'The detailed agenda will be shared prior to the meeting.'}
            </div>
          </div>
          
          <!-- Important Notes -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">Important Notes:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #5d6d7e;">
              <li>Please confirm your attendance by responding to the calendar invitation.</li>
              <li>Review any attached documents before the meeting.</li>
              <li>Prepare any necessary materials or presentations.</li>
              ${meeting.quorum ? `<li>Required quorum for this meeting: ${meeting.quorum} members</li>` : ''}
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
            This is an automated message from the Board of Studies Portal.<br>
            Please do not reply directly to this email.
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
              For technical support, please contact the IT department<br>
              For meeting-related queries, please contact the BOS coordinator
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
BOARD OF STUDIES MEETING INVITATION

${meeting.title}
Reference: ${meetingId}

MEETING DETAILS
--------------
Date: ${formattedDate}
Time: ${formattedTime}
Location: ${meeting.location || 'To be determined'}
${meeting.plateform_link ? `Virtual Meeting Link: ${meeting.plateform_link}` : ''}

AGENDA
------
${meeting.agenda || 'The detailed agenda will be shared prior to the meeting.'}

IMPORTANT NOTES
--------------
* Please confirm your attendance by responding to the calendar invitation
* Review any attached documents before the meeting
* Prepare any necessary materials or presentations
${meeting.quorum ? `* Required quorum for this meeting: ${meeting.quorum} members` : ''}

This is an automated message from the Board of Studies Portal.
Please do not reply directly to this email.

For technical support, please contact the IT department
For meeting-related queries, please contact the BOS coordinator
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendVotingPollEmail = async (emails, poll, createdBy) => {
  const formattedStartDate = new Date(poll.start_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedEndDate = new Date(poll.end_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const pollOptions = poll.options.map((option, index) => 
    `${index + 1}. ${option}`
  ).join('\n                  ');

  const mailOptions = {
    from: `"Board of Studies (BOS)" <${process.env.EMAIL_ADMIN}>`,
    to: emails.join(','),
    subject: `New BOS Voting Poll: ${poll.title} [${poll.poll_id}]`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2c3e50; line-height: 1.6;">
        <!-- Header with Logo and Border -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #e74c3c;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Board of Studies Voting Poll</h1>
          <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 16px;">New Poll Available for Voting</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px; background-color: #ffffff;">
          <!-- Poll Title -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin: 0; font-size: 20px; font-weight: 600;">${poll.title}</h2>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">Poll ID: ${poll.poll_id}</p>
          </div>
          
          <!-- Poll Description -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #e74c3c;">
            <h3 style="color: #2c3e50; font-size: 16px; margin: 0 0 10px 0;">Poll Description:</h3>
            <div style="color: #5d6d7e; white-space: pre-line;">${poll.description}</div>
          </div>
          
          <!-- Poll Details Card -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #e74c3c;">📅 Voting Starts</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${formattedStartDate}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #e74c3c;">⏰ Voting Ends</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${formattedEndDate}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #e74c3c;">👤 Created By</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${createdBy.name} (${createdBy.role})</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #e74c3c;">🎭 Voting Type</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${poll.is_anonymous ? 'Anonymous' : 'Open'} Voting</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #e74c3c;">🔄 Multiple Votes</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${poll.allow_multiple_votes ? 'Allowed' : 'Not Allowed'}</strong>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Voting Options Section -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e9ecef;">
              Voting Options
            </h3>
            <div style="background-color: #ffffff; padding: 15px; border-left: 3px solid #e74c3c;">
              <div style="white-space: pre-line; font-family: monospace; color: #2c3e50;">
                  ${pollOptions}
              </div>
            </div>
          </div>
          
          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 15px 30px; border-radius: 8px; display: inline-block;">
              <h3 style="color: white; margin: 0; font-size: 16px;">🗳️ Ready to Vote?</h3>
              <p style="color: #f8f9fa; margin: 5px 0 0 0; font-size: 14px;">Log in to the BOS Portal to cast your vote</p>
            </div>
          </div>
          
          <!-- Important Notes -->
          <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #ffeaa7;">
            <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">⚠️ Important Voting Guidelines:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Please read the poll description carefully before voting</li>
              <li>Voting is only available during the specified time period</li>
              <li>You can only vote once unless multiple votes are explicitly allowed</li>
              <li>Your vote ${poll.is_anonymous ? 'will remain anonymous' : 'will be recorded with your identity'}</li>
              <li>Make sure to cast your vote before the deadline</li>
              <li>For any questions, contact the poll creator or BOS coordinator</li>
            </ul>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
            This is an automated message from the Board of Studies Voting Portal.<br>
            Please do not reply directly to this email.
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
              Log in to the BOS Portal to participate in this poll<br>
              For technical support, please contact the IT department
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
BOARD OF STUDIES VOTING POLL NOTIFICATION

${poll.title}
Poll ID: ${poll.poll_id}

POLL DESCRIPTION
---------------
${poll.description}

POLL DETAILS
-----------
Voting Starts: ${formattedStartDate}
Voting Ends: ${formattedEndDate}
Created By: ${createdBy.name} (${createdBy.role})
Voting Type: ${poll.is_anonymous ? 'Anonymous' : 'Open'} Voting
Multiple Votes: ${poll.allow_multiple_votes ? 'Allowed' : 'Not Allowed'}

VOTING OPTIONS
-------------
${pollOptions}

IMPORTANT VOTING GUIDELINES
--------------------------
* Please read the poll description carefully before voting
* Voting is only available during the specified time period
* You can only vote once unless multiple votes are explicitly allowed
* Your vote ${poll.is_anonymous ? 'will remain anonymous' : 'will be recorded with your identity'}
* Make sure to cast your vote before the deadline
* For any questions, contact the poll creator or BOS coordinator

Log in to the BOS Portal to participate in this poll.

This is an automated message from the Board of Studies Voting Portal.
Please do not reply directly to this email.

For technical support, please contact the IT department
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendVoteConfirmationEmail = async (email, voter, poll, voteDetails) => {
  const formattedVoteTime = new Date(voteDetails.voted_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedEndDate = new Date(poll.end_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: `"Board of Studies (BOS)" <${process.env.EMAIL_ADMIN}>`,
    to: email,
    subject: `Vote Submitted Successfully - ${poll.title} [${poll.poll_id}]`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2c3e50; line-height: 1.6;">
        <!-- Header with Success Theme -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 3px solid #27ae60;">
          <h1 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Vote Submitted Successfully</h1>
          <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 16px;">Board of Studies Voting Confirmation</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 30px; background-color: #ffffff;">
          <!-- Success Message -->
          <div style="background-color: #d5f4e6; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #27ae60; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🎉</div>
            <h2 style="color: #27ae60; margin: 0; font-size: 20px; font-weight: 600;">Thank You for Voting!</h2>
            <p style="color: #2c3e50; margin: 5px 0 0 0; font-size: 14px;">Your vote has been successfully recorded</p>
          </div>
          
          <!-- Poll Information -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin: 0; font-size: 18px; font-weight: 600;">${poll.title}</h3>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">Poll ID: ${poll.poll_id}</p>
          </div>
          
          <!-- Vote Details Card -->
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #e9ecef;">
            <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">Vote Details</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #27ae60;">👤 Voter</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${voter.name} (${voter.role})</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #27ae60;">🗳️ Selected Option</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong style="color: #e74c3c;">${voteDetails.option_selected}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #27ae60;">⏰ Vote Time</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${formattedVoteTime}</strong>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">
                  <span style="color: #27ae60;">🎭 Voting Type</span>
                </td>
                <td style="padding: 8px 0;">
                  <strong>${poll.is_anonymous ? 'Anonymous' : 'Open'} Voting</strong>
                </td>
              </tr>
              ${voteDetails.comment ? `
              <tr>
                <td style="padding: 8px 0; vertical-align: top;">
                  <span style="color: #27ae60;">💬 Comment</span>
                </td>
                <td style="padding: 8px 0;">
                  <div style="background-color: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #e9ecef;">
                    "${voteDetails.comment}"
                  </div>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Poll Status -->
          <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin-bottom: 25px; border: 1px solid #ffeaa7;">
            <h4 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">📊 Poll Status</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Poll is currently <strong>${poll.status}</strong></li>
              <li>Voting ends on: <strong>${formattedEndDate}</strong></li>
              ${poll.allow_multiple_votes ? 
                '<li>You can change your vote until the poll ends</li>' : 
                '<li>Your vote is final and cannot be changed</li>'
              }
              <li>Results will be ${poll.settings?.show_results_before_end ? 'available during voting' : 'published after voting ends'}</li>
            </ul>
          </div>
          
          <!-- Next Steps -->
          <div style="background-color: #e8f4fd; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #3498db;">
            <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">📋 What's Next?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #2c3e50;">
              <li>Your vote has been securely recorded in the system</li>
              <li>You will receive an email notification when results are published</li>
              <li>Check the BOS Portal for real-time updates on poll status</li>
              <li>Contact the poll creator if you have any questions about this vote</li>
            </ul>
          </div>
          
          <!-- Thank You Message -->
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); padding: 15px 30px; border-radius: 8px; display: inline-block;">
              <h3 style="color: white; margin: 0; font-size: 16px;">🙏 Thank You for Your Participation!</h3>
              <p style="color: #f8f9fa; margin: 5px 0 0 0; font-size: 14px;">Your voice matters in BOS decisions</p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
            This is an automated confirmation from the Board of Studies Voting Portal.<br>
            Please do not reply directly to this email.
          </p>
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e9ecef;">
            <p style="margin: 0; color: #7f8c8d; font-size: 12px;">
              For voting-related queries, contact the BOS coordinator<br>
              For technical support, please contact the IT department
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
VOTE SUBMITTED SUCCESSFULLY - BOARD OF STUDIES

${poll.title}
Poll ID: ${poll.poll_id}

VOTE CONFIRMATION
================
✅ Thank you for voting! Your vote has been successfully recorded.

VOTE DETAILS
-----------
Voter: ${voter.name} (${voter.role})
Selected Option: ${voteDetails.option_selected}
Vote Time: ${formattedVoteTime}
Voting Type: ${poll.is_anonymous ? 'Anonymous' : 'Open'} Voting
${voteDetails.comment ? `Comment: "${voteDetails.comment}"` : ''}

POLL STATUS
----------
* Poll is currently ${poll.status}
* Voting ends on: ${formattedEndDate}
* ${poll.allow_multiple_votes ? 'You can change your vote until the poll ends' : 'Your vote is final and cannot be changed'}
* Results will be ${poll.settings?.show_results_before_end ? 'available during voting' : 'published after voting ends'}

WHAT'S NEXT?
-----------
* Your vote has been securely recorded in the system
* You will receive an email notification when results are published
* Check the BOS Portal for real-time updates on poll status
* Contact the poll creator if you have any questions about this vote

Thank you for your participation! Your voice matters in BOS decisions.

This is an automated confirmation from the Board of Studies Voting Portal.
Please do not reply directly to this email.

For voting-related queries, contact the BOS coordinator
For technical support, please contact the IT department
    `
  };

  await transporter.sendMail(mailOptions);
};
