import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  markExpenseAsPaid,
  rejectExpense,
  getExpenseStatistics,
} from "../../Controllers/Financial/ExpenseController.js";

const router = express.Router();

// Expense routes
router.post("/expense/create", createExpense);
router.get("/expense/list", getAllExpenses);
router.get("/expense/statistics", getExpenseStatistics);
router.get("/expense/:expenseId", getExpenseById);
router.put("/expense/:expenseId", updateExpense);
router.delete("/expense/:expenseId", deleteExpense);
router.patch("/expense/:expenseId/approve", approveExpense);
router.patch("/expense/:expenseId/paid", markExpenseAsPaid);
router.patch("/expense/:expenseId/reject", rejectExpense);

export default router;
