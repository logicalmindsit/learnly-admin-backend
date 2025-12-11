import Expense from "../../Models/Financial/ExpenseModel.js";
import mongoose from "mongoose";

// Create new expense
export const createExpense = async (req, res) => {
  try {
    const expense = new Expense({
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

    await expense.save();
    await expense.populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

// Get all expenses with filters and pagination
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("createdBy approvedBy", "name email role")
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

// Get expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId)
      .populate("createdBy approvedBy", "name email role")
      .populate("auditLog.performedBy", "name email role");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Get expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense",
      error: error.message,
    });
  }
};

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updates = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Store old values for audit
    const oldValues = expense.toObject();

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "auditLog" && key !== "createdBy") {
        expense[key] = updates[key];
      }
    });

    // Add audit log entry
    expense.auditLog.push({
      action: "Updated",
      performedBy: req.user.id,
      timestamp: new Date(),
      changes: {
        old: oldValues,
        new: updates,
      },
    });

    await expense.save();
    await expense.populate("createdBy approvedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    // Add audit log before deletion
    expense.auditLog.push({
      action: "Deleted",
      performedBy: req.user.id,
      timestamp: new Date(),
    });

    await expense.save();
    await Expense.findByIdAndDelete(expenseId);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

// Approve expense
export const approveExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.status = "Approved";
    expense.approvedBy = req.user.id;
    expense.approvedDate = new Date();

    expense.auditLog.push({
      action: "Approved",
      performedBy: req.user.id,
      timestamp: new Date(),
    });

    await expense.save();
    await expense.populate("createdBy approvedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Expense approved successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Approve expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve expense",
      error: error.message,
    });
  }
};

// Mark expense as paid
export const markExpenseAsPaid = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.status = "Paid";

    expense.auditLog.push({
      action: "Paid",
      performedBy: req.user.id,
      timestamp: new Date(),
    });

    await expense.save();
    await expense.populate("createdBy approvedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Expense marked as paid successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Mark expense as paid error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark expense as paid",
      error: error.message,
    });
  }
};

// Reject expense
export const rejectExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { reason } = req.body;

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.status = "Rejected";

    expense.auditLog.push({
      action: "Rejected",
      performedBy: req.user.id,
      timestamp: new Date(),
      changes: { reason },
    });

    await expense.save();
    await expense.populate("createdBy approvedBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Expense rejected successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Reject expense error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject expense",
      error: error.message,
    });
  }
};

// Get expense statistics
export const getExpenseStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const statistics = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgExpense: { $avg: "$amount" },
          maxExpense: { $max: "$amount" },
          minExpense: { $min: "$amount" },
        },
      },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byPaymentMethod = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byStatus = await Expense.aggregate([
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
          totalExpenses: 0,
          totalAmount: 0,
          avgExpense: 0,
          maxExpense: 0,
          minExpense: 0,
        },
        byCategory,
        byPaymentMethod,
        byStatus,
      },
    });
  } catch (error) {
    console.error("Get expense statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};
