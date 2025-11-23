import express from 'express';
import { adminLogin, addAdmin, getAllAdmin, deleteAdminProfile, createTaskForStaffController, getAllTasksForStaffController, updateTaskStatusController, deleteTaskForStaffController, getAllCompletedTasksForStaffController } from '../controllers/adminController.js';
import { refreshToken, validateToken } from '../controllers/authController.js';
import { authenticateToken, requireStaffOrAdmin } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { getAllOrdersForAdminController, getCompletedOrdersControllerForAdmin } from '../controllers/orderController.js';

const adminRoutes = express.Router();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate admin user with email and password to get JWT token
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: admin@yatra.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 expiresIn:
 *                   type: string
 *                   description: Token expiration time
 *                   example: 2h
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 */
adminRoutes.post('/login', adminLogin);

/**
 * @swagger
 * /api/admin/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     description: Refresh an existing JWT token to extend its expiration
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                 expiresIn:
 *                   type: string
 *                   example: 2h
 *       401:
 *         description: Token expired or invalid
 *       400:
 *         description: Token not close to expiration
 */
adminRoutes.post('/refresh', authenticateToken, refreshToken);

/**
 * @swagger
 * /api/admin/validate:
 *   get:
 *     summary: Validate JWT token
 *     description: Check if a JWT token is still valid without refreshing it
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token is valid
 *                 user:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 expiresIn:
 *                   type: integer
 *                   description: Seconds until expiration
 *       401:
 *         description: Token expired or invalid
 */
adminRoutes.get('/validate', validateToken);
// adminRoutes.get('/get-all-tasks', authenticateToken, requireAdmin, getAllTasks);
adminRoutes.post('/add-admin', authenticateToken, requireAdmin, addAdmin);

adminRoutes.get('/get-all-admin', authenticateToken, requireAdmin, getAllAdmin);

adminRoutes.delete('/remove-admin', authenticateToken, requireAdmin, deleteAdminProfile);

//create task for staff by admin
adminRoutes.post('/create-task-for-staff', authenticateToken, requireAdmin, createTaskForStaffController);

// get all tasks for staff by admin also add filter for search and assigned to filter
adminRoutes.get('/get-all-tasks-for-staff', authenticateToken, requireAdmin, getAllTasksForStaffController);

// get all completed tasks for staff by admin
adminRoutes.get('/get-all-completed-tasks-for-staff', authenticateToken, requireAdmin, getAllCompletedTasksForStaffController);

adminRoutes.put('/update-task-status', authenticateToken, requireAdmin, updateTaskStatusController);

adminRoutes.delete('/delete-task-for-staff', authenticateToken, requireAdmin, deleteTaskForStaffController);


// adminRoutes.post('/add-admin', addAdmin);

// Admin orders
adminRoutes.get('/get-all-orders', authenticateToken, requireAdmin, getAllOrdersForAdminController);

adminRoutes.get('/get-completed-orders', authenticateToken, requireAdmin, getCompletedOrdersControllerForAdmin);


/**
 * @swagger
 * /api/admin/add-admin:
 *   post:
 *     summary: Add admin user
 *     description: Add a new admin user to the system
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: admin@yatra.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin password
 *                 example: Admin@123
 *     responses:
 *       200:
 *         description: Admin added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin added successfully
 *       401:
 *         description: Invalid credentials
 */
export default adminRoutes;