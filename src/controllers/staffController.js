import { getStaff, createStaff, getAllStaffData, updateStaffData } from '../models/Staff.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import { createOrder, getOrderByStaffId, getStaffOrderPipelineSummary, getUpcomingDeliveriesForStaff } from '../models/OrderModel.js';
import pool, { query } from '../config/database.js';
import { getTaskByStaffId, getTaskByStaffIdAndTaskId, getTasksForStaff, updateTaskStatus, getStaffTaskSummary, getUpcomingTasksPreview } from '../models/TaskModel.js';

export const getAllStaff = async (req, res) => {
  try {
    // Extract query parameters with defaults
    const { search = "", status = "all", sort = "recent" } = req.query;
    const staff = await getAllStaffData({ search, status, sort });
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get all staff' });
  }
};

export const addStaff = async (req, res) => {
  try {
    const staffData = req.body;
    const result = await createStaff(staffData);

    // Check if the operation was successful
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        error: result.error || null
      });
    }

    // Return success response with the created staff data
    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create staff',
      error: error.message
    });
  }
};

export const staffLogin = async (req, res) => {
  try {
    const { staffId, password } = req.body;
    const staff = await getStaff(staffId);
    if (!staff || staff.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid staff ID or password' });
    }
    // Compare the provided password with the hashed password from database
    const isPasswordValid = await bcrypt.compare(password, staff[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const token = generateToken({ id: staff[0].id, staff_id: staff[0].staff_id, email: staff[0].email, role: 'staff' }, '1h');
    const staffData = {
      id: staff[0].id,
      name: staff[0].name,
      email: staff[0].email,
      role: 'staff',
      token: token
    }

    res.status(200).json({ success: true, data: staffData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to login staff' });
  }
}

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateStaffData(id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message, data: result.data });
  }
  catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
}

export const createOrderController = async (req, res) => {
  try {
    const { orderData } = req.body;
    const result = await createOrder(orderData);
    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}

// Create order using staff_id code (e.g., STF481479) with transactional insert of order and products
export const createOrderByStaffController = async (req, res) => {
  try {
    // staff is authenticated by requireStaff; use the numeric id from JWT
    const staff_id = req.user?.id;
    if (!staff_id) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }

    const {
      user_name,
      user_phone,
      user_email,
      address,
      requested_delivery_date,
      advance_received = false,
      products = [],
    } = req.body || {};

    // Required fields validation
    if (!user_name || !user_phone || !address || !requested_delivery_date) {
      return res.status(400).json({ success: false, message: 'user_name, user_phone, address, requested_delivery_date are required' });
    }
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'products must be an array' });
    }

    // Normalize date (TIMESTAMP column expects 'YYYY-MM-DD HH:mm:ss')
    const rdd = new Date(requested_delivery_date);
    if (isNaN(rdd.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid requested_delivery_date' });
    }
    const requestedDateISO = rdd.toISOString().slice(0, 19).replace('T', ' ');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert order with reference to creating staff (staff_id)
      const insertOrderSql = `INSERT INTO orders (user_name, user_phone, user_email, address, staff_id, requested_delivery_date, advance_received, created_at)
                              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
      const orderResult = await conn.execute(insertOrderSql, [
        user_name,
        user_phone,
        user_email,
        address,
        staff_id,
        requestedDateISO,
        advance_received ? 1 : 0
      ]);
      const orderInsertHeader = orderResult?.[0];
      const order_id = orderInsertHeader?.insertId;
      if (!order_id) {
        throw new Error('Failed to create order');
      }

      // Insert products if provided
      if (products.length > 0) {
        const insertProductSql = `INSERT INTO order_products (order_id, product_name, product_status, created_at) VALUES (?, ?, ?, NOW())`;
        for (const product of products) {
          const product_name = product?.product_name;
          const product_status = product?.product_status || 'Pending';
          if (!product_name) {
            throw new Error('product_name is required for each product');
          }
          await conn.execute(insertProductSql, [order_id, product_name, product_status]);
        }
      }

      await conn.commit();
      conn.release();

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id,
          staff_id,
        }
      });
    } catch (err) {
      try { await conn.rollback(); } catch { }
      try { conn.release(); } catch { }
      return res.status(500).json({ success: false, message: 'Failed to create order', error: err.message });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
}

export const getTasksForStaffController = async (req, res) => {
  try {
    // Resolve staff id: explicit id > explicit staff_id > JWT id > JWT staff_id > email lookup
    let staffId = req.query?.id || req.body?.id || req.user?.id || null;
    if (!staffId) {
      const staffCode = req.query?.staff_id || req.body?.staff_id || req.user?.staff_id || null;
      if (staffCode) {
        const findByCodeSql = `SELECT id FROM staff WHERE staff_id = ? LIMIT 1`;
        const byCodeRows = await query(findByCodeSql, [staffCode]);
        staffId = byCodeRows?.[0]?.id || null;
      }
    }
    if (!staffId && req.user?.email) {
      const findSql = `SELECT id FROM staff WHERE email = ? LIMIT 1`;
      const rows = await query(findSql, [req.user.email]);
      staffId = rows?.[0]?.id || null;
    }

    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }

    const tasks = await getTasksForStaff(staffId);
    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get tasks for staff' });
  }
}

export const getAllCompletedTasksForStaffController = async (req, res) => {
  try {
    const staffId = req.user.id;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }
    const tasks = await getTasksForStaff(staffId, true);
    return res.status(200).json({ success: true, data: tasks });
  }
  catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get completed tasks for staff' });
  }
}

export const updateTaskStatusController = async (req, res) => {
  try {
    const { taskId, status, reason } = req.body;
    const userId = req.user.id;
    // check this task is assigned to the staff
    const task = await getTaskByStaffIdAndTaskId(userId, taskId);
    if (!task || task.length === 0) {
      return res.status(400).json({ success: false, message: 'Task not found' });
    }
    const result = await updateTaskStatus(task[0].task_id, status, reason);
    return res.status(200).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task status' });
  }
}

export const staffDashboardController = async (req, res) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }

    const [
      taskSummary,
      taskPreview,
      orderPipeline,
      upcomingDeliveries
    ] = await Promise.all([
      getStaffTaskSummary(staffId),
      getUpcomingTasksPreview(staffId, 4),
      getStaffOrderPipelineSummary(staffId),
      getUpcomingDeliveriesForStaff(staffId, 4)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        assignedTasks: {
          total: taskSummary.total,
          active: taskSummary.active,
          blocked: taskSummary.blocked
        },
        inProgress: {
          total: taskSummary.in_progress
        },
        completed: {
          total: taskSummary.completed
        },
        orderPipeline: {
          total: orderPipeline.pipeline_total
        },
        yourTasks: taskPreview,
        upcomingDeliveries
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load staff dashboard', error: error.message });
  }
};