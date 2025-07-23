import { Router } from 'express';
const router = Router();
import { 
  createTask, 
  getAllTasks, 
  getTaskById, 
  getTasksByMeetingId,
  getTasksByAssignedTo,
  updateTask, 
  updateTaskStatus,
  deleteTask,
  getOverdueTasks
} from '../../Controllers/BOS/bos-taskController.js';

// CRUD operations
router.post('/createtask', createTask);
router.get('/gettasks', getAllTasks);
router.get('/gettask/:id', getTaskById);
router.put('/updatetask/:id', updateTask);
router.delete('/deletetask/:id', deleteTask);

// Specific queries
router.get('/getmeeting/:meeting_id/tasks', getTasksByMeetingId);
router.get('/getassigned/:assigned_to/tasks', getTasksByAssignedTo);
router.get('/getoverdue', getOverdueTasks);

// Status update
router.patch('/updatetask/:id/status', updateTaskStatus);

export default router;
