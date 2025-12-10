import { query } from '../config/database.js';

export const createTaskTable = async () => {
    const sql = `CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        staff_id INT NOT NULL,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        deadline DATE NOT NULL,
        notes TEXT DEFAULT NULL,
        assigned_by INT NOT NULL,
        FOREIGN KEY (assigned_by) REFERENCES admins(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('todo', 'in_progress', 'completed', 'blocked') DEFAULT 'todo',
        reason TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    const result = await query(sql);
    return result;
}

export const getAllTasks = async ({ page = 1, limit = 10, search = "", status = 'pending', id = null }) => {
    const offset = (page - 1) * limit;
    let searchCondition = "";
    let params = [];
    if (search.trim() !== "") {
        searchCondition = "AND title LIKE ?";
        params.push(`%${search}%`);
    }
    let whereCondition = "WHERE status = ?";
    if (id) {
        whereCondition += " AND staff_id = ?";
        params.unshift(id);
    }
    params.unshift(status);
    const sql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, completed_at, status, created_at FROM tasks ${whereCondition} ${searchCondition ? searchCondition : ""} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const result = await query(sql, params);
    // Map staff_id to id in response (API uses 'id' for staff id, task_id for task primary key)
    return result.map(task => {
        const { staff_id, task_id, ...rest } = task;
        return {
            ...rest,
            task_id,
            id: staff_id // Map staff_id to id for API response
        };
    });
}

export const updateTaskStatus = async (taskId, status, reason = null) => {
    let sql;
    let params;

    if (!taskId) {
        return { success: false, message: 'Task ID is required' };
    }
    if (!status) {
        return { success: false, message: 'Status is required' };
    }
    if (status === 'blocked' && !reason) {
        return { success: false, message: 'Reason is required when status is blocked' };
    }


    // If status is completed, set completed_at to current timestamp
    if (status === 'completed') {
        // Set notes to null if reason is not provided, otherwise use reason
        const reasonValue = reason && reason.trim() !== '' ? reason : null;
        sql = `UPDATE tasks SET status = ?, completed_at = NOW(), reason = ?, updated_at = NOW() WHERE id = ?`;
        params = [status, reasonValue, taskId];
    }
    // For other statuses (todo, in_progress, blocked), set completed_at to null
    // If blocked, store reason in notes; otherwise clear notes
    else {
        const reasonValue = status === 'blocked' ? (reason || '') : '';
        sql = `UPDATE tasks SET status = ?, completed_at = NULL, reason = ? , updated_at = NOW() WHERE id = ?`;
        params = [status, reasonValue, taskId];
    }

    const result = await query(sql, params);
    return result;
}

export const getTaskByStaffId = async (id, page = 1, limit = 10, search = "", status = 'pending') => {
    const offset = (page - 1) * limit;
    let searchCondition = "";
    let params = [id, status];
    if (search.trim() !== "") {
        searchCondition = "AND title LIKE ?";
        params.push(`%${search}%`);
    }
    const sql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, completed_at, status, created_at FROM tasks WHERE staff_id = ? AND status = ? ${searchCondition} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const result = await query(sql, params);
    // Map staff_id to id in response (API uses 'id' for staff id, task_id for task primary key)
    return result.map(task => {
        const { staff_id, task_id, ...rest } = task;
        return {
            ...rest,
            task_id,
            id: staff_id // Map staff_id to id for API response
        };
    });
}

export const createTaskForStaff = async (title, id, deadline, notes, assignedBy) => {
    // id parameter is the staff id from API, map it to staff_id in database
    const sql = `INSERT INTO tasks (title, staff_id, deadline, notes, assigned_by, assigned_at) VALUES (?, ?, ?, ?, ?, NOW())`;
    const result = await query(sql, [title, id, deadline, notes || null, assignedBy]);
    return result;
}



export const getAllTasksForStaff = async (id, page = 1, limit = 10, search = "", status = '', isCompleted = false) => {
    try {
        const offset = (page - 1) * limit;
        let searchCondition = "";
        let statusCondition = "";
        let staffCondition = "";
        let params = [];

        // Add staff_id filter only if id is provided
        if (id) {
            staffCondition = "WHERE t.staff_id = ?";
            params.push(id);
        } else {
            staffCondition = "WHERE 1=1"; // Always true condition to allow other filters
        }

        // Add status filter only if status is provided and not empty
        if (status && status.trim() !== '') {
            statusCondition = "AND t.status = ?";
            params.push(status);
        }

        // Add search condition if search is provided
        if (search.trim() !== "") {
            searchCondition = "AND t.title LIKE ?";
            params.push(`%${search}%`);
        }

        // Main query to get tasks with staff name where status is not completed
        if (isCompleted) {
            statusCondition = "AND t.status = 'completed'";
        } else {
            statusCondition = "AND t.status != 'completed'";
        }

        const sql = `SELECT 
            t.id as task_id, 
            t.title, 
            t.staff_id, 
            t.deadline, 
            t.notes, 
            t.assigned_by, 
            t.assigned_at, 
            t.completed_at, 
            t.status, 
            t.reason,
            t.created_at,
            s.name as assignee_name
        FROM tasks t
        LEFT JOIN staff s ON t.staff_id = s.id
        ${staffCondition} 
        ${statusCondition} 
        ${searchCondition} 
        ORDER BY t.created_at DESC 
        LIMIT ${limit} OFFSET ${offset}`;
        const result = await query(sql, params);

        // Count query to get total records (use same conditions)
        const countSql = `SELECT COUNT(*) as total 
        FROM tasks t
        LEFT JOIN staff s ON t.staff_id = s.id
        ${staffCondition} 
        ${statusCondition} 
        ${searchCondition}`;
        const countResult = await query(countSql, params);
        const total = countResult[0]?.total || 0;

        // Map staff_id to assignee_id and include assignee_name
        const tasks = result.map(task => {
            const { staff_id, task_id, assignee_name, ...rest } = task;
            return {
                ...rest,
                task_id,
                assignee_id: staff_id,
                assignee_name: assignee_name || null
            };
        });

        // Calculate pagination details
        const totalPages = Math.ceil(total / limit);
        const currentPage = parseInt(page);
        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;

        return {
            success: true,
            data: tasks,
            pagination: {
                currentPage,
                limit: parseInt(limit),
                total,
                totalPages,
                hasNextPage,
                hasPreviousPage,
                nextPage: hasNextPage ? currentPage + 1 : null,
                previousPage: hasPreviousPage ? currentPage - 1 : null
            }
        };
    } catch (error) {
        throw error;
    }
}

export const getTasksForStaff = async (id, isCompleted = false) => {
    const statusCondition = isCompleted
        ? "t.status = 'completed'"
        : "t.status <> 'completed'";

    const sql = `
        SELECT 
            t.id AS task_id,
            t.title,
            t.staff_id,
            t.deadline,
            t.notes,
            t.assigned_by,
            t.assigned_at,
            t.completed_at,
            t.status,
            t.created_at
        FROM tasks t
        WHERE t.staff_id = ?
          AND ${statusCondition}
        ORDER BY t.created_at DESC
    `;
    return query(sql, [id]);
};

export const getStaffTaskSummary = async (staffId) => {
    const sql = `
        SELECT
            COUNT(*) AS total_tasks,
            SUM(CASE WHEN status <> 'completed' THEN 1 ELSE 0 END) AS active_tasks,
            SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked_tasks,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM tasks
        WHERE staff_id = ?
    `;
    const [stats] = await query(sql, [staffId]);
    return {
        total: Number(stats?.total_tasks) || 0,
        active: Number(stats?.active_tasks) || 0,
        blocked: Number(stats?.blocked_tasks) || 0,
        in_progress: Number(stats?.in_progress_tasks) || 0,
        completed: Number(stats?.completed_tasks) || 0
    };
};

export const getUpcomingTasksPreview = async (staffId, limit = 4) => {
    const limitValue = Number(limit) > 0 ? Number(limit) : 4;
    const sql = `
        SELECT 
            t.id AS task_id,
            t.title,
            t.staff_id,
            t.deadline,
            t.notes,
            t.status,
            t.assigned_at,
            t.created_at
        FROM tasks t
        WHERE t.staff_id = ?
        AND t.status <> 'completed'
        ORDER BY 
            CASE WHEN t.deadline IS NULL THEN 1 ELSE 0 END,
            t.deadline ASC,
            t.created_at ASC
        LIMIT ${limitValue}
    `;
    return query(sql, [staffId]);
};


export const getTaskByStaffIdAndTaskId = async (staffId, taskId) => {
    const sql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, completed_at, status, created_at FROM tasks WHERE staff_id = ? AND id = ?`;
    const result = await query(sql, [staffId, taskId]);
    return result;
}

export const deleteTaskForStaff = async (taskId) => {
    const sql = `DELETE FROM tasks WHERE id = ?`;
    const result = await query(sql, [taskId]);
    return result;
}

export const updateTaskDetails = async (taskId, updateData) => {
    const updateFields = [];
    const updateValues = [];

    // Build dynamic update query based on provided fields
    if (updateData.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updateData.title);
    }

    if (updateData.deadline !== undefined) {
        updateFields.push('deadline = ?');
        // Convert ISO date string to DATE format (YYYY-MM-DD)
        const deadlineDate = updateData.deadline ? new Date(updateData.deadline).toISOString().split('T')[0] : null;
        updateValues.push(deadlineDate);
    }

    if (updateData.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(updateData.notes || null);
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');

    if (updateFields.length === 1) {
        // Only updated_at, no actual fields to update
        return { success: false, message: 'No fields to update' };
    }

    updateValues.push(taskId);

    const sql = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await query(sql, updateValues);
    return result;
}

export const getTaskById = async (taskId) => {
    const sql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, completed_at, updated_at, status, reason, created_at FROM tasks WHERE id = ?`;
    const result = await query(sql, [taskId]);
    return result.length > 0 ? result[0] : null;
}