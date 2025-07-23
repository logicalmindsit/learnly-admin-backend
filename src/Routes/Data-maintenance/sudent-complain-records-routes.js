import express from 'express';
import {
  createComplaint,
  getAllComplaints,
  updateComplaintStatus,
  deleteComplaint
} from '../../Controllers/Data-Maintenance/sudent-complaint-records.js';

const router = express.Router();

router.post('/complaint/create', createComplaint);
router.get('/complaint/all', getAllComplaints);
router.put('/complaint/update-status/:id', updateComplaintStatus);
router.delete('/complaint/delete/:id', deleteComplaint);

export default router;