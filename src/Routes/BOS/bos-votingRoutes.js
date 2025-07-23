import { Router } from 'express';
const router = Router();
import { 
  createVotingPoll,
  getAllVotingPolls,
  getVotingPollById,
  castVote,
  getVotingResults,
  updateVotingPoll,
  deleteVotingPoll,
  getActivePolls,
  getPollStatistics,
  getLiveResults
} from '../../Controllers/BOS/bos-votingController.js';

// Poll CRUD operations
router.post('/create-poll', createVotingPoll);
router.get('/polls', getAllVotingPolls);
router.get('/poll/:id', getVotingPollById);
router.put('/poll/:poll_id', updateVotingPoll);
router.delete('/poll/:poll_id', deleteVotingPoll);

// Voting operations
router.post('/poll/:poll_id/vote', castVote);
router.get('/poll/:poll_id/results', getVotingResults);
router.get('/poll/:poll_id/live-results', getLiveResults);

// User-specific operations
router.get('/active-polls', getActivePolls);

// Statistics (for boscontroller only)
router.get('/statistics', getPollStatistics);

export default router;
