import express from 'express';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { assignTaskController, getAllTasksController, updateTaskStatusController } from '../controllers/adminController.js';

const taskRouter = express.Router();

taskRouter.post('/assign-task', authenticateToken, requireAdmin, assignTaskController);
taskRouter.get('/get-all-tasks', authenticateToken, requireAdmin, getAllTasksController);
taskRouter.put('/update-task-status', authenticateToken, requireStaffOrAdmin, updateTaskStatusController);

export default taskRouter;
