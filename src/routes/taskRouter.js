import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import {  updateTaskDetailsController } from '../controllers/adminController.js';

const taskRouter = express.Router();
// update task details
taskRouter.put('/update-task-details', authenticateToken, requireAdmin, updateTaskDetailsController);

export default taskRouter;
