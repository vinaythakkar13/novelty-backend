import { createOrder, createOrderProductsTable, createOrderTable, getAllOrders, getAllOrdersByStaffId, getOrdersForStaff, updateOrderAdvancePayment, updateOrderFullPayment, updateOrderReviewLinkSent, updateOrderProductsStatus, updateOrderStatus, getAllOrdersForAdmin, getCompletedOrdersForAdmin, getCompletedOrdersForStaff, updateOrderAdvancePaymentForAdmin, updateOrderFullPaymentForAdmin, updateOrderStatusForAdmin } from '../models/OrderModel.js';

(async () => {
  await createOrderTable();
  await createOrderProductsTable();
})();

export const createOrderController = async (req, res) => {
  try {
    const orderData = req.body;
    const order = await createOrder(orderData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
}

export const getAllOrdersController = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    // convert query params to numbers
    page = parseInt(page);
    limit = parseInt(limit);

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (user.role !== 'admin') {
      const orders = await getAllOrdersByStaffId({ staffId: user.id });
      return res.status(200).json(orders);
    }

    const orders = await getAllOrders({ page, limit, search });

    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get all orders', error: error.message });
  }
};

export const getOrdersForStaffController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { search = null, sort = null } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }
    const orders = await getOrdersForStaff(userId, search, sort);
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get orders for staff', error: error.message });
  }
}

export const updateOrderAdvancePaymentController = async (req, res) => {
  try {

    const { orderId, advance_received } = req.body;

    // advance_received is a boolean value
    if (!orderId || typeof advance_received !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Order ID and advance received value are required' });
    }

    const order = await updateOrderAdvancePayment(orderId, advance_received);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order advance payment' });
    }
    return res.status(200).json({ success: true, message: 'Order advance payment updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order advance payment', error: error.message });
  }
}

export const updateOrderFullPaymentController = async (req, res) => {
  try {
    const { orderId, full_received } = req.body;
    if (!orderId || typeof full_received !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Order ID and full received value are required' });
    }
    const order = await updateOrderFullPayment(orderId, full_received);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order full payment received' });
    }
    return res.status(200).json({ success: true, message: 'Order full payment received updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order full payment received status', error: error.message });
  }
}

export const updateOrderReviewLinkSentController = async (req, res) => {
  try {
    const { orderId, review_link_sent } = req.body;
    if (!orderId || typeof review_link_sent !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Order ID and review link sent value are required' });
    }
    const order = await updateOrderReviewLinkSent(orderId, review_link_sent);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order review link sent' });
    }
    return res.status(200).json({ success: true, message: 'Order review link sent updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order review link sent', error: error.message });
  }
}

// Update multiple order product statuses for a staff member
export const updateOrderProductStatusController = async (req, res) => {
  try {
    const { orderId, products } = req.body;
    const staffId = req.user?.id;
    if (!orderId || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'orderId and products array are required' });
    }

    const validStatuses = ['pending', 'material_requested', 'material_received', 'sent_to_workers', 'final_product_received'];
    const validProductsStatuses = products.filter(product => validStatuses.includes(product.product_status.toLowerCase()));
    if (validProductsStatuses.length !== products.length) {
      return res.status(400).json({ success: false, message: 'Invalid product status' });
    }

    const result = await updateOrderProductsStatus(orderId, products, staffId);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: result.message, updated: result.updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order product statuses', error: error.message });
  }
}

export const updateOrderStatusController = async (req, res) => {
  try {
    const { orderId, status, notes } = req.body;
    const validStatuses = ['pending', 'processing', 'completed', 'out_for_delivery', 'delivered'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await updateOrderStatus(orderId, status, notes);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order status' });
    }
    return res.status(200).json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
}

export const getCompletedOrdersForStaffController = async (req, res) => {
  // get staff id from req.user

  try {

    const staffId = req.user.id;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Unable to resolve staff id' });
    }

    const { startDate = null, endDate = null, search = null, rating = null, status = null, page = 1, limit = 10 } = req.query;

    let ratingFilter = null;
    if (rating !== null && rating !== undefined && rating !== '') {
      const parts = String(rating).split(',');
      const min = Number(parts[0]);
      const max = parts[1] !== undefined ? Number(parts[1]) : Number(parts[0]);
      if (!Number.isNaN(min) && !Number.isNaN(max)) {
        ratingFilter = { min, max };
      }
    }

    let statusFilter = null;
    if (status) {
      statusFilter = String(status)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
    }

    const orders = await getCompletedOrdersForStaff({ startDate, endDate, search, rating: ratingFilter, statuses: statusFilter, staffId });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get completed orders', error: error.message });
  }
}

export const getAllOrdersForAdminController = async (req, res) => {
  try {
    // pagination and all, pending, processing, completed, out_for_delivery, delivered Sort options Delivery date ↑ (deliveryAsc), Delivery date ↓ (deliveryDesc), Recently created (createdDesc)
    let { page = 1, limit = 10, search = "", sort = "createdDesc", status = null } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    search = search.trim();
    sort = sort.trim();
    status = status ? status.trim() : null;

    if (sort !== "deliveryAsc" && sort !== "deliveryDesc" && sort !== "createdDesc") {
      return res.status(400).json({ success: false, message: 'Invalid sort option' });
    }
    const orders = await getAllOrdersForAdmin({ page, limit, search, sort, status });
    if (orders.length === 0) {
      return res.status(400).json({ success: false, message: 'No orders found' });
    }
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get all orders for admin', error: error.message });
  }
}

export const getCompletedOrdersControllerForAdmin = async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      search = null,
      rating = null,
      status = null,
      staffId = null,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const ratingFilter = (() => {
      if (!rating) return null;
      const parts = String(rating).split(',');
      const min = Number(parts[0]);
      const max = parts[1] !== undefined ? Number(parts[1]) : Number(parts[0]);
      if (Number.isNaN(min) || Number.isNaN(max)) return null;
      return { min, max };
    })();

    const statusFilter = status
      ? String(status)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
      : null;

    const orders = await getCompletedOrdersForAdmin({
      startDate,
      endDate,
      search,
      rating: ratingFilter,
      status: statusFilter,
      staffId,
      page: pageNum,
      limit: limitNum
    });

    if (!orders?.data?.length) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    return res.status(200).json({ success: true, ...orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get completed orders', error: error.message });
  }
};

export const updateOrderAdvancePaymentControllerForAdmin = async (req, res) => {
  try {
    const { orderId, advance_received } = req.body;
    if (!orderId || typeof advance_received !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Order ID and advance received value are required' });
    }
    const order = await updateOrderAdvancePaymentForAdmin(orderId, advance_received);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order advance payment' });
    }
    return res.status(200).json({ success: true, message: 'Order advance payment updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order advance payment', error: error.message });
  }
}

export const updateOrderFullPaymentControllerForAdmin = async (req, res) => {
  try {
    const { orderId, full_received } = req.body;
    if (!orderId || typeof full_received !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Order ID and full received value are required' });
    }
    const order = await updateOrderFullPaymentForAdmin(orderId, full_received);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order full payment' });
    }
    return res.status(200).json({ success: true, message: 'Order full payment updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order full payment', error: error.message });
  }
}

export const updateOrderStatusControllerForAdmin = async (req, res) => {
  try {
    const { orderId, status, notes } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: 'Order ID and status are required' });
    }
    const order = await updateOrderStatusForAdmin(orderId, status, notes);
    if (order.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Failed to update order status' });
    }
    return res.status(200).json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
}