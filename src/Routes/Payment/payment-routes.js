// Routes/Payment-Routes.js
import express from "express";
import { getAllPayments } from "../../Controllers/Payment/payment-controller.js";

const router = express.Router();

router.get("/payments", getAllPayments);

export default router;
