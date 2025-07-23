import VotingPoll from "../Models/BOS/bos-Voting.js";

// Function to update poll statuses based on current date/time
export const updatePollStatuses = async () => {
  try {
    const now = new Date();
    
    // Update polls that should be active
    await VotingPoll.updateMany(
      {
        status: "draft",
        start_date: { $lte: now }
      },
      {
        $set: { status: "active" }
      }
    );

    // Update polls that should be completed
    await VotingPoll.updateMany(
      {
        status: "active",
        end_date: { $lte: now },
        "settings.auto_close_on_end_date": true
      },
      {
        $set: { status: "completed" }
      }
    );

  } catch (error) {
    console.error("Error updating poll statuses:", error);
  }
};

// Function to run periodic poll status updates
export const startPollStatusScheduler = () => {
  // Run every 5 minutes
  setInterval(updatePollStatuses, 5 * 60 * 1000);
  
  // Run immediately on start
  updatePollStatuses();
};

// Function to send notifications for upcoming poll deadlines
export const checkPollDeadlines = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find polls ending in 1 hour
    const pollsEndingInOneHour = await VotingPoll.find({
      status: "active",
      end_date: {
        $gte: now,
        $lte: oneHourFromNow
      }
    });

    // Find polls ending in 1 day
    const pollsEndingInOneDay = await VotingPoll.find({
      status: "active",
      end_date: {
        $gte: oneHourFromNow,
        $lte: oneDayFromNow
      }
    });

    // Here you can implement notification logic
    // For example, send emails or push notifications
    
    if (pollsEndingInOneHour.length > 0) {
      console.log(`${pollsEndingInOneHour.length} polls ending in 1 hour`);
      // Implement notification logic here
    }

    if (pollsEndingInOneDay.length > 0) {
      console.log(`${pollsEndingInOneDay.length} polls ending in 1 day`);
      // Implement notification logic here
    }

  } catch (error) {
    console.error("Error checking poll deadlines:", error);
  }
};

// Function to start deadline checker
export const startDeadlineChecker = () => {
  // Run every hour
  setInterval(checkPollDeadlines, 60 * 60 * 1000);
};
