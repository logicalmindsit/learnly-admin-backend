import { Schema, model } from "mongoose";

// Vote Sub-Schema
const voteSchema = new Schema(
  {
    voter_id: { type: String, required: true },
    voter_name: { type: String, required: true },
    voter_role: { 
      type: String, 
      required: true,
      enum: ["boscontroller", "bosmembers"]
    },
    option_selected: { type: String, required: true },
    voted_at: { type: Date, default: Date.now },
    ip_address: { type: String },
  },
  { _id: false }
);

// Voting Poll Schema
const votingPollSchema = new Schema({
  poll_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  options: [{ 
    type: String, 
    required: true 
  }],
  created_by: {
    admin_id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  eligible_voters: [{
    type: String,
    enum: ["boscontroller", "bosmembers"]
  }],
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  status: {
    type: String,
    enum: ["draft", "active", "completed", "cancelled"],
    default: "draft"
  },
  votes: [voteSchema],
  total_votes: { type: Number, default: 0 },
  results: [{
    option: { type: String },
    vote_count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],
  is_anonymous: { type: Boolean, default: false },
  allow_multiple_votes: { type: Boolean, default: false },
  settings: {
    require_comments: { type: Boolean, default: false },
    show_results_before_end: { type: Boolean, default: false },
    auto_close_on_end_date: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Middleware to automatically update poll status based on dates
votingPollSchema.pre("save", function (next) {
  const now = new Date();
  
  if (this.status === "draft" && this.start_date <= now) {
    this.status = "active";
  }
  
  if (this.status === "active" && this.end_date <= now && this.settings.auto_close_on_end_date) {
    this.status = "completed";
  }
  
  next();
});

// Method to calculate results
votingPollSchema.methods.calculateResults = function() {
  const optionCounts = {};
  
  // Initialize all options with 0 count
  this.options.forEach(option => {
    optionCounts[option] = 0;
  });
  
  // Count votes for each option
  this.votes.forEach(vote => {
    if (optionCounts.hasOwnProperty(vote.option_selected)) {
      optionCounts[vote.option_selected]++;
    }
  });
  
  // Calculate percentages and update results
  this.total_votes = this.votes.length;
  this.results = this.options.map(option => ({
    option: option,
    vote_count: optionCounts[option],
    percentage: this.total_votes > 0 ? Math.round((optionCounts[option] / this.total_votes) * 100) : 0
  }));
  
  return this.results;
};

// Method to check if user has already voted
votingPollSchema.methods.hasUserVoted = function(userId) {
  return this.votes.some(vote => vote.voter_id === userId);
};

// Method to check if poll is active
votingPollSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === "active" && this.start_date <= now && this.end_date > now;
};

// Method to check if user is eligible to vote
votingPollSchema.methods.isEligibleToVote = function(role) {
  return this.eligible_voters.includes(role);
};

export default model("Bos-Voting-Poll", votingPollSchema);
