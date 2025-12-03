import express from 'express';
import { getAllStaff, addStaff , staffLogin, updateStaff, getTasksForStaffController, updateTaskStatusController, getAllCompletedTasksForStaffController, staffDashboardController, createOrderByStaffController, updateStaffCreatedOrderController } from '../controllers/staffController.js';
import { getOrdersForStaffController, updateOrderAdvancePaymentController, updateOrderFullPaymentController, updateOrderReviewLinkSentController, updateOrderProductStatusController, updateOrderStatusController, getCompletedOrdersForStaffController } from '../controllers/orderController.js';
import { authenticateToken, requireAdmin, requireStaff } from '../middleware/auth.js';

const router = express.Router();

router.get('/get-all-staff', authenticateToken, requireAdmin, getAllStaff);

router.post('/add-staff',authenticateToken, requireAdmin, addStaff);

router.put('/update-staff/:id', authenticateToken, requireAdmin, updateStaff);

router.post('/login', staffLogin);

router.get('/get-tasks', authenticateToken, requireStaff, getTasksForStaffController);

// get all completed tasks for staff
router.get('/get-all-completed-tasks', authenticateToken, requireStaff, getAllCompletedTasksForStaffController);

router.post('/update-task-status', authenticateToken, requireStaff, updateTaskStatusController);

// Create order by staff using staff_id code (transactional)
router.post('/create-order', authenticateToken, requireStaff, createOrderByStaffController);

router.get('/get-orders', authenticateToken, requireStaff, getOrdersForStaffController);

router.put('/update-order-aedvance-payment', authenticateToken, requireStaff, updateOrderAdvancePaymentController);

router.put('/update-order-full-payment', authenticateToken, requireStaff, updateOrderFullPaymentController);

router.put('/update-order-review-link-sent', authenticateToken, requireStaff, updateOrderReviewLinkSentController);

router.put('/update-order-product-status', authenticateToken, requireStaff, updateOrderProductStatusController);

router.put('/update-order-status', authenticateToken, requireStaff, updateOrderStatusController);

router.get('/get-completed-orders', authenticateToken, requireStaff, getCompletedOrdersForStaffController);

// staff dashboard API
router.get('/staff-dashboard', authenticateToken, requireStaff, staffDashboardController);


// update staff  order
router.put('/update-order', authenticateToken, requireStaff, updateStaffCreatedOrderController);
export default router;
