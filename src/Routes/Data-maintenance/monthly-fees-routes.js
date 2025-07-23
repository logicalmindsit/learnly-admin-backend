import express from "express";
import { addMonthlyFee, getMonthlyFees, updateMonthlyFee, deleteMonthlyFee } from "../../Controllers/Data-Maintenance/monthly-fees-records-controller.js";

const router = express.Router();

router.post("/post-monthly-fees", addMonthlyFee);
router.get("/get-monthly-fees", getMonthlyFees);
router.put("/put-monthly-fees/:id", updateMonthlyFee);
router.delete("/delete-monthly-fees/:id", deleteMonthlyFee);

export default router;
