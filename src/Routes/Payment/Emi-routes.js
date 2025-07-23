import express from 'express';
import { getAllEMIPlans } from '../../Controllers/Payment/Emi-controller.js';

const router = express.Router();

router.get('/emi-plans', getAllEMIPlans);

export default router;
