import { query } from '../config/database.js';

export const createOrderTable = async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        user_phone VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) ,
        address TEXT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        advance_received BOOLEAN DEFAULT FALSE,
        full_received BOOLEAN DEFAULT FALSE,
        review_link_sent BOOLEAN DEFAULT FALSE,
        staff_id INT NOT NULL,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        delivery_notes TEXT DEFAULT NULL,
  
        requested_delivery_date TIMESTAMP NOT NULL,
        actual_delivery_date TIMESTAMP DEFAULT NULL,
  
        status ENUM('pending', 'processing', 'completed', 'out_for_delivery', 'delivered') DEFAULT 'pending',
        rating INT DEFAULT NULL,
        review TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
        return await query(sql);
    } catch (err) {
        // Error creating table
    }
};


export const createOrderProductsTable = async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS order_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_name ENUM('sofa', 'mattress', 'curtains') NOT NULL,
        product_status ENUM('pending', 'material_requested', 'material_received', 'sent_to_workers', 'final_product_received') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `;
    try {
        return await query(sql);
    } catch (err) {
        // Error creating table ${err}
    }
};

export const createOrder = async (orderData) => {
    try {
        const { user_name, user_phone, user_email = null, address, staff_id, requested_delivery_date, advance_received, products } = orderData;
        const created_at = new Date();
        const sql = `INSERT INTO orders (user_name, user_phone, user_email, address, staff_id, requested_delivery_date, advance_received, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        const result = await query(sql, [user_name, user_phone, user_email, address, staff_id, requested_delivery_date, advance_received, created_at]);
        if (result.affectedRows === 0) {
            return { success: false, message: `Failed to create order` };
        }
        else {
            const order_id = result.insertId;
            for (const product of products) {
                const { product_name, product_status } = product;
                const sql = `INSERT INTO order_products (order_id, product_name, product_status, created_at) VALUES (?, ?, ?, NOW())`;
                const result = await query(sql, [order_id, product_name, product_status, created_at]);
                return result;
            }
        }
    }
    catch (error) {
        return { success: false, message: `Failed to create order`, error: error.message };
    }
}

const formatOrders = (rows) => {
    if (rows?.length === 0) {
        return [];
    }
    const orders = {};
    rows.forEach((row) => {
        if (!orders[row.order_id]) {
            orders[row.order_id] = {
                order_id: row.order_id,
                user_name: row.user_name,
                user_phone: row.user_phone,
                user_email: row.user_email,
                address: row.address,
                staff_id: row.staff_id,
                staff_name: row.staff_name || null,
                order_date: row.order_date,
                requested_delivery_date: row.requested_delivery_date,
                actual_delivery_date: row.actual_delivery_date,
                advance_received: row.advance_received,
                order_status: row.order_status,
                rating: row.rating,
                review: row.review,
                created_at: row.created_at,
                review_link_sent: row.review_link_sent,
                full_received: row.full_received,
                products: [],
            };
        }

        if (row.product_id) {
            orders[row.order_id].products.push({
                product_id: row.product_id,
                product_name: row.product_name,
                product_status: row.product_status,
            });
        }
    });

    return Object.values(orders);
};


export const getAllOrders = async ({ page = 1, limit = 10, search = "" }) => {
    try {
        const offset = (page - 1) * limit;

        // --------------------------------------
        // ✅ Build search condition dynamically
        // --------------------------------------
        let searchCondition = "";
        let params = [];

        if (search.trim() !== "") {
            searchCondition = "WHERE o.user_name LIKE ? OR o.user_phone LIKE ?";
            params.push(`%${search}%`, `%${search}%`);
        }

        // --------------------------------------
        // ✅ Main query (ensure correct spacing)
        // --------------------------------------
        const sql = `
        SELECT 
          o.id AS order_id,
          o.user_name,
          o.user_phone,
          o.address,
          o.staff_id,
          o.order_date,
          o.requested_delivery_date,
          o.actual_delivery_date,
          o.advance_received,
          o.status AS order_status,
          o.rating,
          o.review,
          o.created_at,
  
          op.id AS product_id,
          op.product_name,
          op.product_status
  
        FROM orders o
        LEFT JOIN order_products op ON o.id = op.order_id
        ${searchCondition ? " " + searchCondition : ""}
        ORDER BY o.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

        const result = await query(sql, [...params]);

        // --------------------------------------
        // ✅ Count query for pagination
        // --------------------------------------
        const countSql = `
        SELECT COUNT(*) AS total
        FROM orders o
        ${searchCondition ? " " + searchCondition : ""}
      `;

        const countRows = await query(countSql, params);
        const total = countRows[0]?.total;
        const orders = {
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: result?.length > 0 ? formatOrders(result) : [],
            admin: true,
        };
        return orders;
    } catch (error) {
        return [];
    }
};

export const getAllOrdersByStaffId = async ({ staffId, page = 1, limit = 10, search = "" }) => {
    try {
        const offset = (page - 1) * limit;
        let searchCondition = "";
        const params = [staffId];
        if (search.trim() !== "") {
            searchCondition = "AND (o.user_name LIKE ? OR o.user_phone LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        const sql = `
        SELECT 
          o.id AS order_id,
          o.user_name,
          o.user_phone,
          o.address,
          o.staff_id,
          o.order_date,
          o.requested_delivery_date,
          o.actual_delivery_date,
          o.advance_received,
          o.status AS order_status,
          o.rating,
          o.review,
          o.created_at,
  
          op.id AS product_id,
          op.product_name,
          op.product_status
        FROM orders o
        LEFT JOIN order_products op ON o.id = op.order_id
        WHERE o.staff_id = ?
        ${searchCondition ? " " + searchCondition : ""}
        ORDER BY o.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

        const result = await query(sql, params);

        const countSql = `
        SELECT COUNT(*) AS total
        FROM orders o
        WHERE o.staff_id = ?
        ${searchCondition ? " " + searchCondition : ""}
      `;
        const countRows = await query(countSql, params);
        const total = countRows[0]?.total;
        return {
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: result?.length > 0 ? formatOrders(result) : [],
            staff_id: staffId,
        };
    } catch (error) {
        return [];
    }
}

// Get orders for a staff (grouped with products). Convenience function without pagination.
export const getOrdersForStaff = async (staffId) => {
    const sql = `
      SELECT 
        o.id AS order_id,
        o.user_name,
        o.user_phone,
        o.user_email,
        o.address,
        o.staff_id,
        o.order_date,
        o.requested_delivery_date,
        o.actual_delivery_date,
        o.advance_received,
        o.status AS order_status,
        o.rating,
        o.review,
        o.review_link_sent,
        o.full_received,
        o.created_at,

        op.id AS product_id,
        op.product_name,
        op.product_status
      FROM orders o
      LEFT JOIN order_products op ON o.id = op.order_id
      WHERE o.staff_id = ?
        AND NOT (
          o.status = 'delivered'
          AND o.review_link_sent = 1
          AND o.full_received = 1
        )
      ORDER BY o.id DESC
    `;
    const rows = await query(sql, [staffId]);
    return formatOrders(rows);
}

export const getOrderByStaffId = async (staffId) => {
    const sql = `SELECT o.id AS order_id, o.user_name, o.user_phone, o.user_email, o.address, o.staff_id, o.order_date, o.requested_delivery_date, o.actual_delivery_date, o.advance_received, o.status AS order_status, o.rating, o.review, o.created_at, op.id AS product_id, op.product_name, op.product_status FROM orders o LEFT JOIN order_products op ON o.id = op.order_id WHERE o.staff_id = ?`;
    const result = await query(sql, [staffId]);
    return result;
}

export const updateOrderAdvancePayment = async (orderId, advance_received) => {
    const sql = `UPDATE orders SET advance_received = ? WHERE id = ?`;
    const result = await query(sql, [advance_received, orderId]);
    return result;
}

export const updateOrderFullPayment = async (orderId, full_received) => {
    const sql = `UPDATE orders SET full_received = ? WHERE id = ?`;
    const result = await query(sql, [full_received, orderId]);
    return result;
}

export const updateOrderReviewLinkSent = async (orderId, review_link_sent) => {
    const sql = `UPDATE orders SET review_link_sent = ? WHERE id = ?`;
    const result = await query(sql, [review_link_sent, orderId]);
    return result;
}

/**
 * Update multiple product statuses for a given order, ensuring the order belongs to the staff.
 * products: Array<{ product_id: number, product_status: string }>
 */
export const updateOrderProductsStatus = async (orderId, products = [], staffId) => {
    // Validate order ownership
    const orderRows = await query(`SELECT id, staff_id FROM orders WHERE id = ? LIMIT 1`, [orderId]);
    if (!orderRows || orderRows.length === 0) {
        return { success: false, message: 'Order not found' };
    }
    if (staffId && orderRows[0].staff_id !== Number(staffId)) {
        return { success: false, message: 'Not authorized to update this order' };
    }

    if (!Array.isArray(products) || products.length === 0) {
        return { success: false, message: 'No products to update' };
    }

    // Map incoming status keys to DB enum values
    const statusMap = {
        'pending': 'Pending',
        'material_requested': 'Material Requested',
        'material_received': 'Material Received',
        'sent_to_workers': 'Sent To Workers',
        'final_product_received': 'Final Product Received'
    };

    // Validate all requested statuses before updating
    for (const p of products) {
        if (!p?.product_id || !p?.product_status) {
            return { success: false, message: 'Each product must include product_id and product_status' };
        }
        const mapped = statusMap[String(p.product_status).toLowerCase()];
        if (!mapped) {
            return { success: false, message: `Invalid product_status '${p.product_status}' for product_id ${p.product_id}` };
        }
    }

    // Perform updates sequentially
    let updated = 0;
    for (const p of products) {
        const mapped = statusMap[String(p.product_status).toLowerCase()];
        const sql = `UPDATE order_products SET product_status = ? WHERE id = ? AND order_id = ?`;
        const result = await query(sql, [mapped, p.product_id, orderId]);
        if (result && result.affectedRows > 0) {
            updated += result.affectedRows;
        }
    }

    return { success: true, message: 'Product statuses updated', updated };
}

export const updateOrderStatus = async (orderId, status, notes = '') => {
    const delivery_notes = status === 'delivered' ? notes : null;
    const delivery_date = status === 'delivered' ? new Date() : null;
    const sql = `UPDATE orders SET status = ?, delivery_notes = ?, actual_delivery_date = ? WHERE id = ?`;
    const result = await query(sql, [status, delivery_notes, delivery_date, orderId]);
    return result;
}

export const getStaffOrderPipelineSummary = async (staffId) => {
    const sql = `
        SELECT 
            SUM(CASE WHEN NOT (o.status = 'delivered' AND o.review_link_sent = 1) THEN 1 ELSE 0 END) AS pipeline_total
        FROM orders o
        WHERE o.staff_id = ?
    `;
    const [row] = await query(sql, [staffId]);
    return {
        pipeline_total: Number(row?.pipeline_total) || 0
    };
};

export const getUpcomingDeliveriesForStaff = async (staffId, limit = 4) => {
    const limitValue = Number(limit) > 0 ? Number(limit) : 4;
    const sql = `
        SELECT 
            o.id AS order_id,
            o.user_name,
            o.user_phone,
            o.user_email,
            o.address,
            o.staff_id,
            o.order_date,
            o.requested_delivery_date,
            o.actual_delivery_date,
            o.advance_received,
            o.status AS order_status,
            o.rating,
            o.review,
            o.review_link_sent,
            o.full_received,
            o.created_at
        FROM orders o
        WHERE o.staff_id = ?
          AND NOT (o.status = 'delivered' AND o.review_link_sent = 1 AND o.full_received = 1)
        ORDER BY 
            CASE WHEN o.requested_delivery_date IS NULL THEN 1 ELSE 0 END,
            o.requested_delivery_date ASC,
            o.created_at ASC
        LIMIT ${limitValue}
    `;
    return query(sql, [staffId]);
};


const VALID_ORDER_STATUSES = ['pending', 'processing', 'completed', 'out_for_delivery', 'delivered'];

export const getCompletedOrdersForStaff = async ({
    startDate = null,
    endDate = null,
    search = null,
    rating = null,
    statuses = null,
    staffId = null
}) => {


    let conditions = [
        "o.review_link_sent = 1",
        "o.full_received = 1"
    ];

    let params = [];

    // --- Status Filter ---
    let statusList =
        Array.isArray(statuses) && statuses.length > 0
            ? statuses
            : ["delivered", "completed"]; // default

    statusList = statusList
        .map(s => s?.trim()?.toLowerCase())
        .filter(s => VALID_ORDER_STATUSES.includes(s));

    // fallback if empty
    if (statusList.length === 0) {
        statusList = ["delivered"];
    }

    const placeholders = statusList.map(() => "?").join(", ");
    conditions.unshift(`o.status IN (${placeholders})`);
    params.push(...statusList);

    // --- Date Filter ---
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const startStr = start.toISOString().slice(0, 19).replace("T", " ");
            const endStr = end.toISOString().slice(0, 19).replace("T", " ");
            conditions.push("o.created_at BETWEEN ? AND ?");
            params.push(startStr, endStr);
        }
    }

    // --- Search Filter ---
    const normalizedSearch = (typeof search === 'string' && search.trim().toLowerCase() !== 'null')
        ? search.trim()
        : null;

    if (normalizedSearch) {
        const like = `%${normalizedSearch}%`;
        conditions.push("(o.user_name LIKE ? OR o.user_phone LIKE ? OR o.user_email LIKE ?)");
        params.push(like, like, like);
    }

    // --- Rating Filter ---
    if (rating && rating.min != null && rating.max != null) {
        conditions.push("o.rating IS NOT NULL AND o.rating BETWEEN ? AND ?");
        params.push(rating.min, rating.max);
    }

    // Final WHERE clause
    const whereClause = conditions.join(" AND ");

    const sql = `
        SELECT 
            o.id AS order_id,
            o.user_name,
            o.user_phone,
            o.user_email,
            o.address,
            o.staff_id,
            o.order_date,
            o.requested_delivery_date,
            o.actual_delivery_date,
            o.advance_received,
            o.status AS order_status,
            o.rating,
            o.review,
            o.review_link_sent,
            o.full_received,
            o.delivery_notes,
            o.created_at,
            op.id AS product_id,
            op.product_name,
            op.product_status
        FROM orders o
        LEFT JOIN order_products op ON o.id = op.order_id
        WHERE ${whereClause}
        AND o.staff_id = ?
        ORDER BY o.id DESC
    `;

    const result = await query(sql, [...params, staffId]);

    // Format orders (group products properly)
    return formatOrders(result);
};


// export const getCompletedOrders = async ({
//     startDate = null,
//     endDate = null,
//     search = null,
//     rating = null,
//     statuses = null
// }) => {

//     let conditions = [
//         "o.review_link_sent = 1",
//         "o.full_received = 1"
//     ];

//     let params = [];

//     // --- Status Filter ---
//     let statusList =
//         Array.isArray(statuses) && statuses.length > 0
//             ? statuses
//             : ["delivered", "completed"];

//     statusList = statusList
//         .map(s => s?.trim()?.toLowerCase())
//         .filter(s => VALID_ORDER_STATUSES.includes(s));

//     if (statusList.length === 0) {
//         statusList = ["delivered"];
//     }

//     const placeholders = statusList.map(() => "?").join(", ");
//     conditions.unshift(`o.status IN (${placeholders})`);
//     params.push(...statusList);

//     // --- Date Filter ---
//     if (startDate && endDate) {
//         const start = new Date(startDate);
//         const end = new Date(endDate);

//         if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
//             const startStr = start.toISOString().slice(0, 19).replace("T", " ");
//             const endStr = end.toISOString().slice(0, 19).replace("T", " ");
//             conditions.push("o.created_at BETWEEN ? AND ?");
//             params.push(startStr, endStr);
//         }
//     }

//     // --- Search Filter ---
//     const normalizedSearch = (typeof search === 'string' && search.trim().toLowerCase() !== 'null')
//         ? search.trim()
//         : null;

//     if (normalizedSearch) {
//         const like = `%${normalizedSearch}%`;
//         conditions.push("(o.user_name LIKE ? OR o.user_phone LIKE ? OR o.user_email LIKE ?)");
//         params.push(like, like, like);
//     }

//     // --- Rating Filter ---
//     if (rating && rating.min != null && rating.max != null) {
//         conditions.push("o.rating IS NOT NULL AND o.rating BETWEEN ? AND ?");
//         params.push(rating.min, rating.max);
//     }

//     // Build WHERE clause
//     const whereClause = conditions.join(" AND ");

//     const sql = `
//         SELECT 
//             o.*
//         FROM orders o
//         WHERE ${whereClause}
//         ORDER BY o.id DESC
//     `;

//     const result = await query(sql, params);

//     return result; // direct, no formatter since no join
// };


export const getAllOrdersForAdmin = async ({
    page = 1,
    limit = 10,
    search = "",
    sort = "createdDesc",
    status = null,
    staffId = null
}) => {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;
    const offset = (pageNum - 1) * limitNum;
    const filters = [
        "NOT (o.full_received = 1 AND o.status = 'delivered' AND o.review_link_sent = 1)"
    ];
    const params = [];

    const normalizedSearch =
        typeof search === "string" && search.trim().toLowerCase() !== "null"
            ? search.trim()
            : "";
    if (normalizedSearch) {
        const like = `%${normalizedSearch}%`;
        filters.push("(o.user_name LIKE ? OR o.user_phone LIKE ? OR o.user_email LIKE ? OR o.address LIKE ?)");
        params.push(like, like, like, like);
    }

    if (status) {
        const statusList = Array.isArray(status)
            ? status
            : String(status)
                .split(",")
                .map(s => s.trim().toLowerCase())
                .filter(Boolean);
        if (statusList.length) {
            const placeholders = statusList.map(() => "?").join(", ");
            filters.push(`o.status IN (${placeholders})`);
            params.push(...statusList);
        }
    }

    const hasStaffId =
        staffId !== undefined &&
        staffId !== null &&
        staffId !== '' &&
        staffId !== 'null' &&
        staffId !== 'undefined';

    if (hasStaffId) {
        filters.push("o.staff_id = ?");
        params.push(Number(staffId) || staffId);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    let orderBy = "o.created_at DESC";
    if (sort === "deliveryAsc") orderBy = "o.actual_delivery_date ASC";
    else if (sort === "deliveryDesc") orderBy = "o.actual_delivery_date DESC";

    const countSql = `SELECT COUNT(*) AS total FROM orders o ${whereClause}`;
    const countParams = [...params];
    const countResult = await query(countSql, countParams);
    const total = countResult[0]?.total || 0;

    const limitClause = `LIMIT ${limitNum} OFFSET ${offset}`;
    const dataParams = [...params];
    const sql = `
        SELECT 
            o.id AS order_id,
            o.user_name,
            o.user_phone,
            o.user_email,
            o.address,
            o.staff_id,
            s.name AS staff_name,
            o.order_date,
            o.requested_delivery_date,
            o.actual_delivery_date,
            o.advance_received,
            o.status AS order_status,
            o.rating,
            o.review,
            o.created_at,
            o.review_link_sent,
            o.full_received,
            op.id AS product_id,
            op.product_name,
            op.product_status
        FROM orders o
        LEFT JOIN staff s ON o.staff_id = s.id
        LEFT JOIN order_products op ON o.id = op.order_id
        ${whereClause}
        ORDER BY ${orderBy}
        ${limitClause}`;

    const rows = await query(sql, dataParams);
    return {
        success: true,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        data: formatOrders(rows)
    };
};

// retrieve completed orders for admin which has status delivered and review_link_sent is 1 and full_received is 1
export const getCompletedOrdersForAdmin = async ({
    startDate = null,
    endDate = null,
    search = null,
    rating = null,
    status = null,
    staffId = null,
    page = 1,
    limit = 10
}) => {
    const offset = (page - 1) * limit;
    const conditions = [
        "o.review_link_sent = 1",
        "o.full_received = 1"
    ];
    const params = [];

    // Status filter (allow multiple)
    let statuses = Array.isArray(status) ? status : (status ? [status] : ['delivered', 'completed']);
    statuses = statuses
        .map(s => s?.trim()?.toLowerCase())
        .filter(s => VALID_ORDER_STATUSES.includes(s));
    if (statuses.length === 0) {
        statuses = ['delivered'];
    }
    const statusPlaceholders = statuses.map(() => '?').join(', ');
    conditions.push(`o.status IN (${statusPlaceholders})`);
    params.push(...statuses);

    // Staff filter
    if (staffId) {
        conditions.push("o.staff_id = ?");
        params.push(staffId);
    }

    // Rating filter
    if (rating && rating.min != null && rating.max != null) {
        conditions.push("o.rating IS NOT NULL AND o.rating BETWEEN ? AND ?");
        params.push(rating.min, rating.max);
    }

    // Date filter
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const startStr = start.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = end.toISOString().slice(0, 19).replace('T', ' ');
            conditions.push("o.created_at BETWEEN ? AND ?");
            params.push(startStr, endStr);
        }
    }

    // Search filter
    const normalizedSearch = (typeof search === 'string' && search.trim().toLowerCase() !== 'null')
        ? search.trim()
        : "";
    if (normalizedSearch !== "") {
        const like = `%${normalizedSearch}%`;
        conditions.push("(o.user_name LIKE ? OR o.user_phone LIKE ? OR o.user_email LIKE ?)");
        params.push(like, like, like);
    }

    const whereClause = conditions.join(" AND ");

    const sql = `
        SELECT 
            o.id AS order_id,
            o.user_name,
            o.user_phone,
            o.user_email,
            o.address,
            o.staff_id,
            s.name AS staff_name,
            o.order_date,
            o.requested_delivery_date,
            o.actual_delivery_date,
            o.advance_received,
            o.status AS order_status,
            o.rating,
            o.review,
            o.review_link_sent,
            o.full_received,
            o.delivery_notes,
            o.created_at,
            op.id AS product_id,
            op.product_name,
            op.product_status
        FROM orders o
        LEFT JOIN staff s ON o.staff_id = s.id
        LEFT JOIN order_products op ON o.id = op.order_id
        WHERE ${whereClause}
        ORDER BY o.id DESC
        LIMIT ${limit} OFFSET ${offset}
    `;
    const countSql = `
        SELECT COUNT(*) AS total
        FROM orders o
        LEFT JOIN staff s ON o.staff_id = s.id
        WHERE ${whereClause}
    `;

    const [rows, countRows] = await Promise.all([
        query(sql, params),
        query(countSql, params)
    ]);

    return {
        success: true,
        page,
        limit,
        total: countRows[0]?.total || 0,
        totalPages: Math.ceil((countRows[0]?.total || 0) / limit),
        data: formatOrders(rows)
    };
}