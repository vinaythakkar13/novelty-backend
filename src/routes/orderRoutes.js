import express from 'express';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { createOrderController, getAllOrdersController } from '../controllers/orderController.js';

const orderRoutes = express.Router();

orderRoutes.post('/create-order', authenticateToken, requireStaffOrAdmin, createOrderController);
orderRoutes.get('/get-all-orders', authenticateToken, requireStaffOrAdmin, getAllOrdersController);

export default orderRoutes;