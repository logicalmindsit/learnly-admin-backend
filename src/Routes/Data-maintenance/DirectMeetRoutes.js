import express from 'express';
import { createDirectMeetFee, getAllDirectMeetFees, updateDirectMeetFee, deleteDirectMeetFee } from '../../Controllers/Data-Maintenance/DirectMeetFees.js';

const router = express.Router();

router.post('/post-direct-meet-fees', createDirectMeetFee);
router.get('/get-direct-meet-fees', getAllDirectMeetFees);
router.put('/put-direct-meet-fees/:id', updateDirectMeetFee);
router.delete('/delete-direct-meet-fees/:id', deleteDirectMeetFee);

export default router;