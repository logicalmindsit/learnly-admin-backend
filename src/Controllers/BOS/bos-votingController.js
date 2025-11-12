import VotingPoll from "../../Models/BOS/bos-Voting.js";
import Admin from "../../Models/Admin/Admin-login-Model.js";
import { sendVotingPollEmail, sendVoteConfirmationEmail } from "../../Notification/Bos-Email.js";

// Generate Poll ID
const generatePollId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `POLL${timestamp}${random}`;
};

// Create new voting poll (Only boscontroller can create)
export const createVotingPoll = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      options, 
      start_date, 
      end_date, 
      eligible_voters,
      is_anonymous,
      allow_multiple_votes,
      settings 
    } = req.body;

    // Verify user exists and has boscontroller role
    const admin = await Admin.findById(req.user.id);
    if (!admin || admin.role !== "boscontroller") {
      return res.status(403).json({
        success: false,
        message: "Only BOS Controllers can create voting polls",
      });
    }

    // Validation
    if (!title || !description || !options || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 options are required for voting",
      });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const poll_id = generatePollId();

    const newPoll = new VotingPoll({
      poll_id,
      title,
      description,
      options: options.filter(option => option.trim() !== ""), // Remove empty options
      created_by: {
        admin_id: admin._id.toString(),
        name: admin.name,
        role: admin.role
      },
      eligible_voters: eligible_voters || ["boscontroller", "bosmembers"],
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      is_anonymous: is_anonymous || false,
      allow_multiple_votes: allow_multiple_votes || false,
      settings: {
        require_comments: settings?.require_comments || false,
        show_results_before_end: settings?.show_results_before_end || false,
        auto_close_on_end_date: settings?.auto_close_on_end_date !== false
      }
    });

    await newPoll.save();

    // Send email notifications to all BOS controllers and members
    try {
      const eligibleUsers = await Admin.find({
        role: { $in: ["boscontroller", "bosmembers"] },
        email: { $exists: true, $ne: null }
      });

      if (eligibleUsers.length > 0) {
        const emailAddresses = eligibleUsers.map(user => user.email).filter(email => email);
        
        if (emailAddresses.length > 0) {
          await sendVotingPollEmail(emailAddresses, newPoll, {
            name: admin.name,
            role: admin.role
          });
          console.log(`Voting poll notification sent to ${emailAddresses.length} recipients`);
        }
      }
    } catch (emailError) {
      console.error("Error sending voting poll notification emails:", emailError);
      // Don't fail the entire poll creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Voting poll created successfully",
      data: newPoll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating voting poll",
      error: error.message,
    });
  }
};

// Get all voting polls
export const getAllVotingPolls = async (req, res) => {
  try {
    const { status, created_by } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    if (created_by) {
      query["created_by.admin_id"] = created_by;
    }

    const polls = await VotingPoll.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Voting polls retrieved successfully",
      data: polls,
      count: polls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving voting polls",
      error: error.message,
    });
  }
};

// Get voting poll by ID
export const getVotingPollById = async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await VotingPoll.findOne({ poll_id: id });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Voting poll retrieved successfully",
      data: poll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving voting poll",
      error: error.message,
    });
  }
};

// Cast vote
export const castVote = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const { option_selected, comment } = req.body;

    // Verify user exists and has eligible role
    const admin = await Admin.findById(req.user.id);
    if (!admin || !["boscontroller", "bosmembers"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Only BOS Controllers and Members can vote",
      });
    }

    const poll = await VotingPoll.findOne({ poll_id });
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    // Check if poll is active
    if (!poll.isActive()) {
      return res.status(400).json({
        success: false,
        message: "Voting poll is not active or has expired",
      });
    }

    // Check if user is eligible to vote
    if (!poll.isEligibleToVote(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not eligible to vote in this poll",
      });
    }

    // Check if user has already voted (if multiple votes not allowed)
    if (!poll.allow_multiple_votes && poll.hasUserVoted(admin._id.toString())) {
      return res.status(400).json({
        success: false,
        message: "You have already voted in this poll",
      });
    }

    // Validate selected option
    if (!poll.options.includes(option_selected)) {
      return res.status(400).json({
        success: false,
        message: "Invalid option selected",
      });
    }

    // Add vote
    const vote = {
      voter_id: admin._id.toString(),
      voter_name: poll.is_anonymous ? "Anonymous" : admin.name,
      voter_role: admin.role,
      option_selected,
      voted_at: new Date(),
      ip_address: req.ip,
      comment: comment || ""
    };

    poll.votes.push(vote);
    poll.calculateResults();
    await poll.save();

    // Send vote confirmation email to the voter
    try {
      if (admin.email) {
        await sendVoteConfirmationEmail(admin.email, {
          name: admin.name,
          role: admin.role
        }, poll, {
          option_selected: vote.option_selected,
          voted_at: vote.voted_at,
          comment: vote.comment
        });
        console.log(`Vote confirmation email sent to ${admin.email}`);
      }
    } catch (emailError) {
      console.error("Error sending vote confirmation email:", emailError);
      // Don't fail the vote if email fails
    }

    res.status(200).json({
      success: true,
      message: "Vote cast successfully",
      data: {
        poll_id: poll.poll_id,
        option_selected,
        voted_at: vote.voted_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error casting vote",
      error: error.message,
    });
  }
};

// Get voting results
export const getVotingResults = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const poll = await VotingPoll.findOne({ poll_id });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    // Check if results can be shown
    if (!poll.settings.show_results_before_end && poll.status === "active") {
      return res.status(403).json({
        success: false,
        message: "Results cannot be viewed until voting ends",
      });
    }

    // Calculate latest results
    poll.calculateResults();

    const results = {
      poll_id: poll.poll_id,
      title: poll.title,
      status: poll.status,
      total_votes: poll.total_votes,
      results: poll.results,
      voting_period: {
        start_date: poll.start_date,
        end_date: poll.end_date
      },
      created_by: poll.created_by
    };

    // Include individual votes if not anonymous and user has permission
    if (!poll.is_anonymous) {
      results.votes = poll.votes.map(vote => ({
        voter_name: vote.voter_name,
        voter_role: vote.voter_role,
        option_selected: vote.option_selected,
        voted_at: vote.voted_at,
        comment: vote.comment
      }));
    }

    res.status(200).json({
      success: true,
      message: "Voting results retrieved successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving voting results",
      error: error.message,
    });
  }
};

// Update voting poll (Only creator or boscontroller can update)
export const updateVotingPoll = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const admin = await Admin.findById(req.user.id);

    if (!admin || admin.role !== "boscontroller") {
      return res.status(403).json({
        success: false,
        message: "Only BOS Controllers can update voting polls",
      });
    }

    const poll = await VotingPoll.findOne({ poll_id });
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    // Check if poll can be updated (only if no votes cast or poll is in draft)
    if (poll.votes.length > 0 && poll.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Cannot update poll after voting has started",
      });
    }

    const allowedUpdates = ["title", "description", "options", "start_date", "end_date", "status", "settings"];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(poll, updates);
    await poll.save();

    res.status(200).json({
      success: true,
      message: "Voting poll updated successfully",
      data: poll,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating voting poll",
      error: error.message,
    });
  }
};

// Delete voting poll (Only creator can delete)
export const deleteVotingPoll = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const admin = await Admin.findById(req.user.id);

    if (!admin || admin.role !== "boscontroller") {
      return res.status(403).json({
        success: false,
        message: "Only BOS Controllers can delete voting polls",
      });
    }

    const poll = await VotingPoll.findOne({ poll_id });
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    // Check if poll can be deleted (only if no votes cast)
    if (poll.votes.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete poll after votes have been cast",
      });
    }

    await VotingPoll.deleteOne({ poll_id });

    res.status(200).json({
      success: true,
      message: "Voting poll deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting voting poll",
      error: error.message,
    });
  }
};

// Get active polls for current user
export const getActivePolls = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin || !["boscontroller", "bosmembers"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const now = new Date();
    const activePolls = await VotingPoll.find({
      status: "active",
      start_date: { $lte: now },
      end_date: { $gt: now },
      eligible_voters: { $in: [admin.role] }
    }).sort({ createdAt: -1 });

    // Add voting status for each poll
    const pollsWithVotingStatus = activePolls.map(poll => {
      const hasVoted = poll.hasUserVoted(admin._id.toString());
      return {
        ...poll.toObject(),
        user_has_voted: hasVoted,
        can_vote: poll.allow_multiple_votes || !hasVoted
      };
    });

    res.status(200).json({
      success: true,
      message: "Active polls retrieved successfully",
      data: pollsWithVotingStatus,
      count: pollsWithVotingStatus.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving active polls",
      error: error.message,
    });
  }
};

// Get live results for real-time tracking
export const getLiveResults = async (req, res) => {
  try {
    const { poll_id } = req.params;
    const admin = await Admin.findById(req.user.id);

    if (!admin || !["boscontroller", "bosmembers"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const poll = await VotingPoll.findOne({ poll_id });
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: "Voting poll not found",
      });
    }

    // Calculate real-time results
    poll.calculateResults();

    // Check if poll has ended and auto-close if needed
    const now = new Date();
    if (poll.status === "active" && poll.end_date <= now && poll.settings.auto_close_on_end_date) {
      poll.status = "completed";
      await poll.save();
    }

    const liveResults = {
      poll_id: poll.poll_id,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      is_active: poll.isActive(),
      total_votes: poll.total_votes,
      results: poll.results,
      voting_period: {
        start_date: poll.start_date,
        end_date: poll.end_date,
        time_remaining: poll.end_date > now ? poll.end_date - now : 0
      },
      settings: {
        show_results_before_end: poll.settings.show_results_before_end,
        is_anonymous: poll.is_anonymous
      },
      created_by: poll.created_by,
      last_updated: new Date()
    };

    // Add recent voting activity (last 5 votes) if not anonymous
    if (!poll.is_anonymous) {
      liveResults.recent_votes = poll.votes
        .slice(-5)
        .reverse()
        .map(vote => ({
          voter_name: vote.voter_name,
          voter_role: vote.voter_role,
          option_selected: vote.option_selected,
          voted_at: vote.voted_at
        }));
    }

    res.status(200).json({
      success: true,
      message: "Live results retrieved successfully",
      data: liveResults,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving live results",
      error: error.message,
    });
  }
};

// Get poll statistics
export const getPollStatistics = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin || admin.role !== "boscontroller") {
      return res.status(403).json({
        success: false,
        message: "Only BOS Controllers can view poll statistics",
      });
    }

    const stats = await VotingPoll.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_votes: { $sum: "$total_votes" }
        }
      }
    ]);

    const totalPolls = await VotingPoll.countDocuments();
    const activePolls = await VotingPoll.countDocuments({ status: "active" });
    const completedPolls = await VotingPoll.countDocuments({ status: "completed" });

    res.status(200).json({
      success: true,
      message: "Poll statistics retrieved successfully",
      data: {
        total_polls: totalPolls,
        active_polls: activePolls,
        completed_polls: completedPolls,
        status_breakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving poll statistics",
      error: error.message,
    });
  }
};
