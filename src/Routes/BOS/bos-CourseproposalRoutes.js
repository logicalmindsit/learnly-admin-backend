import { Router } from 'express';
const router = Router();
import { createProposal, getAllProposals, getProposalById, updateProposal, updateStatus } from '../../Controllers/BOS/bos-Courseproposal.js';

// CRUD operations
router.post('/createproposal', createProposal);
router.get('/getproposal', getAllProposals);
router.get('/getproposal/:id', getProposalById);
router.put('/updateproposal/:id', updateProposal);

// Status update
router.patch('/updateproposal/:id/status', updateStatus);

export default router;
