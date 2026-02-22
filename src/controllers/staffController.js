import { getStaff, createStaff, getAllStaffData, updateStaffData } from '../models/Staff.js';
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcrypt';
import { createOrder, getOrderByStaffId, getStaffOrderPipelineSummary, getUpcomingDeliveriesForStaff } from '../models/OrderModel.js';
import pool, { query } from '../config/database.js';
import { getTaskByStaffId, getTaskByStaffIdAndTaskId, getTasksForStaff, updateTaskStatus, getStaffTaskSummary, getUpcomingTasksPreview } from '../models/TaskModel.js';
import { notifyAdmins } from '../services/notificationService.js';

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

    const token = generateToken({ id: staff[0].id, staff_id: staff[0].staff_id, email: staff[0].email, role: 'staff' }, '24h');
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

      // Trigger notification to admin
      notifyAdmins('New Order Created', `A new order has been created by staff member for ${user_name}`);

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
    console.log('Result: ', result)
    // Trigger notification to admin
    if (result.affectedRows > 0) {
      console.log('Task updated successfully');
      const staffName = req.user?.name || 'A staff member';
      notifyAdmins('Task Updated', `${staffName} updated task "${task[0].title}" to ${status}`);
    }

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

export const updateStaffCreatedOrderController = async (req, res) => {
  try {
    const staffId = req.user?.id;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'invalid staff request' });
    }

    const {
      orderId,
      orderData = {},
      products = []
    } = req.body || {};

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'invalid order request' });
    }

    // Merge legacy top-level fields for backward compatibility
    if (typeof req.body.status !== 'undefined' && typeof orderData.status === 'undefined') {
      orderData.status = req.body.status;
    }

    if (typeof req.body.notes !== 'undefined' && typeof orderData.notes === 'undefined') {
      orderData.notes = req.body.notes;
    }

    if (typeof orderData.requestedDeliveryDate !== 'undefined' && typeof orderData.requested_delivery_date === 'undefined') {
      orderData.requested_delivery_date = orderData.requestedDeliveryDate;
    }

    // Ensure the order belongs to the authenticated staff member
    const existingOrder = await query(
      `SELECT id FROM orders WHERE id = ? AND staff_id = ? LIMIT 1`,
      [orderId, staffId]
    );

    if (!existingOrder || existingOrder.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found for this staff member' });
    }

    const connection = await pool.getConnection();
    const mapBoolean = (value) => {
      if (typeof value === 'boolean') return value ? 1 : 0;
      if (value === '1' || value === 1 || value === 'true') return 1;
      if (value === '0' || value === 0 || value === 'false') return 0;
      return value;
    };

    const normalizeStatus = (status) => {
      if (!status || typeof status !== 'string') {
        return 'Pending';
      }
      const lookup = {
        pending: 'Pending',
        material_requested: 'Material Requested',
        material_received: 'Material Received',
        sent_to_workers: 'Sent To Workers',
        final_product_received: 'Final Product Received'
      };
      return lookup[status.toLowerCase()] || status;
    };

    try {
      await connection.beginTransaction();

      // --- Update order level fields ---
      const updatableFields = [
        'user_name',
        'user_phone',
        'user_email',
        'address',
        'requested_delivery_date',
        'advance_received',
        'full_received',
        'review_link_sent',
        'status',
        'notes'
      ];

      const updateClauses = [];
      const updateValues = [];

      updatableFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(orderData, field)) {
          let value = orderData[field];
          if (['advance_received', 'full_received', 'review_link_sent'].includes(field)) {
            value = mapBoolean(value);
          }

          if (field === 'requested_delivery_date' && value) {
            const dateValue = new Date(value);
            if (Number.isNaN(dateValue.getTime())) {
              throw new Error('Invalid requested_delivery_date');
            }
            value = dateValue.toISOString().slice(0, 19).replace('T', ' ');
          }

          if (field === 'notes') {
            updateClauses.push('delivery_notes = ?');
          } else {
            updateClauses.push(`${field} = ?`);
          }
          updateValues.push(value);
        }
      });

      if (updateClauses.length) {
        await connection.execute(
          `UPDATE orders SET ${updateClauses.join(', ')} WHERE id = ?`,
          [...updateValues, orderId]
        );
      }

      // --- Handle product level changes ---
      const [existingProducts] = await connection.execute(
        `SELECT id FROM order_products WHERE order_id = ?`,
        [orderId]
      );
      const incomingProducts = Array.isArray(products) ? products : [];
      const incomingIds = new Set(
        incomingProducts
          .filter((item) => Number(item?.product_id))
          .map((item) => Number(item.product_id))
      );

      const productsToAdd = incomingProducts.filter((item) => !item?.product_id);
      const productsToUpdate = incomingProducts.filter((item) => Number(item?.product_id));
      const productsToRemove = existingProducts
        .filter((product) => !incomingIds.has(product.id))
        .map((product) => product.id);

      let addedCount = 0;
      let updatedCount = 0;
      let removedCount = 0;

      if (productsToAdd.length) {
        const insertSql = `INSERT INTO order_products (order_id, product_name, product_status, created_at) VALUES (?, ?, ?, NOW())`;
        for (const product of productsToAdd) {
          if (!product?.product_name) {
            continue;
          }
          const [insertResult] = await connection.execute(insertSql, [
            orderId,
            product.product_name,
            normalizeStatus(product.product_status || 'pending')
          ]);
          addedCount += insertResult?.affectedRows || 0;
        }
      }

      if (productsToUpdate.length) {
        for (const product of productsToUpdate) {
          const updateParts = [];
          const values = [];

          if (typeof product.product_name === 'string' && product.product_name.trim() !== '') {
            updateParts.push('product_name = ?');
            values.push(product.product_name.trim());
          }

          if (product.product_status) {
            updateParts.push('product_status = ?');
            values.push(normalizeStatus(product.product_status));
          }

          if (!updateParts.length) {
            continue;
          }

          const [productResult] = await connection.execute(
            `UPDATE order_products SET ${updateParts.join(', ')} WHERE id = ? AND order_id = ?`,
            [...values, product.product_id, orderId]
          );
          updatedCount += productResult?.affectedRows || 0;
        }
      }

      if (productsToRemove.length) {
        const placeholders = productsToRemove.map(() => '?').join(', ');
        const [removeResult] = await connection.execute(
          `DELETE FROM order_products WHERE order_id = ? AND id IN (${placeholders})`,
          [orderId, ...productsToRemove]
        );
        removedCount += removeResult?.affectedRows || 0;
      }

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: {
          orderId,
          orderFieldsUpdated: updateClauses.length,
          products: {
            added: addedCount,
            updated: updatedCount,
            removed: removedCount
          }
        }
      });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update staff created order',
      error: error.message
    });
  }
}
