import express from 'express';
import { refreshToken, validateToken, updateFcmToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const authRoutes = express.Router();

authRoutes.post('/refresh', authenticateToken, refreshToken);
authRoutes.get('/validate', validateToken);
authRoutes.post('/update-fcm-token', authenticateToken, updateFcmToken);

export default authRoutes;
