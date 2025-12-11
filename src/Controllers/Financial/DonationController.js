import Donation from "../../Models/Financial/DonationModel.js";
import mongoose from "mongoose";

// Create new donation
export const createDonation = async (req, res) => {
  try {
    const donation = new Donation({
      ...req.body,
      createdBy: req.user.id,
      auditLog: [
        {
          action: "Created",
          performedBy: req.user.id,
          timestamp: new Date(),
          changes: { ...req.body },
        },
      ],
    });

    await donation.save();
    await donation.populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create donation",
      error: error.message,
    });
  }
};

// Get all donations with filters and pagination
export const getAllDonations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      donationType,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (donationType) query.donationType = donationType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate("createdBy verifiedBy", "name email role")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Donation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: donations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donations",
      error: error.message,
    });
  }
};

// Get donation by ID
export const getDonationById = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId)
      .populate("createdBy verifiedBy", "name email role")
      .populate("auditLog.performedBy", "name email role");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    console.error("Get donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation",
      error: error.message,
    });
  }
};

// Update donation
export const updateDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const updates = req.body;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Store old values for audit
    const oldValues = donation.toObject();

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "auditLog" && key !== "createdBy") {
        donation[key] = updates[key];
      }
    });

    // Add audit log entry
    donation.auditLog.push({
      action: "Updated",
      performedBy: req.user.id,
      timestamp: new Date(),
      changes: {
        old: oldValues,
        new: updates,
      },
    });

    await donation.save();
    await donation.populate("createdBy verifiedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      data: donation,
    });
  } catch (error) {
    console.error("Update donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update donation",
      error: error.message,
    });
  }
};

// Delete donation
export const deleteDonation = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Add audit log before deletion
    donation.auditLog.push({
      action: "Deleted",
      performedBy: req.user.id,
      timestamp: new Date(),
    });

    await donation.save();
    await Donation.findByIdAndDelete(donationId);

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    console.error("Delete donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete donation",
      error: error.message,
    });
  }
};

// Verify donation
export const verifyDonation = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    donation.status = "Verified";
    donation.verifiedBy = req.user.id;

    donation.auditLog.push({
      action: "Verified",
      performedBy: req.user.id,
      timestamp: new Date(),
    });

    await donation.save();
    await donation.populate("createdBy verifiedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Donation verified successfully",
      data: donation,
    });
  } catch (error) {
    console.error("Verify donation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify donation",
      error: error.message,
    });
  }
};

// Get donation statistics
export const getDonationStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const statistics = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalDonations: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgDonation: { $avg: "$amount" },
          maxDonation: { $max: "$amount" },
          minDonation: { $min: "$amount" },
        },
      },
    ]);

    const byCategory = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byType = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$donationType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byStatus = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: statistics[0] || {
          totalDonations: 0,
          totalAmount: 0,
          avgDonation: 0,
          maxDonation: 0,
          minDonation: 0,
        },
        byCategory,
        byType,
        byStatus,
      },
    });
  } catch (error) {
    console.error("Get donation statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};
