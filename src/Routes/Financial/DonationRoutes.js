import express from "express";
import {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  verifyDonation,
  getDonationStatistics,
} from "../../Controllers/Financial/DonationController.js";

const router = express.Router();

// Donation routes
router.post("/donation/create", createDonation);
router.get("/donation/list", getAllDonations);
router.get("/donation/statistics", getDonationStatistics);
router.get("/donation/:donationId", getDonationById);
router.put("/donation/:donationId", updateDonation);
router.delete("/donation/:donationId", deleteDonation);
router.patch("/donation/:donationId/verify", verifyDonation);

export default router;
