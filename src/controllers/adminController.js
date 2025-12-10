import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import { adminLoginFunction, createAdmin, deleteAdmin, getAllAdminsExceptLoggedInAdmin } from '../models/AdminModel.js';
import { generateToken } from '../middleware/auth.js';
import { getAllTasks, updateTaskStatus, getTaskByStaffId, createTaskForStaff, getAllTasksForStaff, deleteTaskForStaff, updateTaskDetails, getTaskById, getTaskByStaffIdAndTaskId } from '../models/TaskModel.js';
import { deleteStaffById } from '../models/Staff.js';

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await adminLoginFunction(email, password);
        if (!admin || admin.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const adminData = admin[0];
        const token = generateToken({ email: adminData.email, role: 'admin' }, '24h');
        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token: token,
            is_super_admin: adminData.is_super_admin || false
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to login admin' });
    }
};

export const addAdmin = async (req, res) => {
    try {
        const { name, email, password, is_super_admin = false } = req.body;

        // Validation: Check if email and password are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Validation: Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if admin with this email already exists
        const checkSql = `SELECT id FROM admins WHERE email = ?`;
        const existingAdmin = await query(checkSql, [email]);

        if (existingAdmin.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        // Hash password with bcrypt using salt rounds (10 rounds is a good balance)
        // bcrypt automatically generates a salt and includes it in the hash
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert admin into database with hashed password using the model function
        // The model function handles the is_super_admin column check automatically
        const result = await createAdmin({
            name,
            email,
            password: hashedPassword,
            is_super_admin
        });

        return res.status(201).json({
            success: true,
            message: 'Admin added successfully',
            data: {
                id: result.insertId,
                email: email
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to add admin',
            error: error.message
        });
    }
};

export const getAllAdmin = async (req, res) => {
    const { search = "" } = req.query;
    try {
        const admins = await getAllAdminsExceptLoggedInAdmin(req.user.email, search);
        return res.status(200).json({ success: true, data: admins });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to get all admins' });
    }
}

export const deleteAdminProfile = async (req, res) => {
    const { email } = req.body;
    try {
        await deleteAdmin(email);
        return res.status(200).json({ success: true, message: 'Admin profile deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete admin profile' });
    }
}

export const getAllTasksController = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", status = 'pending', id = null } = req.query;
        const tasks = await getAllTasks({ page, limit, search, status, id });
        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to get all tasks' });
    }
}


export const getTaskByStaffIdController = async (req, res) => {
    try {
        const { id, page = 1, limit = 10, search = "", status = 'pending' } = req.query;
        const tasks = await getTaskByStaffId(id, page, limit, search, status);
        return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to get task by staff id' });
    }
}



// create task for staff by admin
export const createTaskForStaffController = async (req, res) => {
    try {
        const { title, id, deadline, notes } = req.body;

        // Validation - API uses 'id' instead of 'assignedTo'
        if (!title || !id || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Title, id, and deadline are required'
            });
        }

        // Parse deadline from ISO string and extract date part (YYYY-MM-DD) for DATE column
        let deadlineDate;
        try {
            const deadlineObj = new Date(deadline);
            if (isNaN(deadlineObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid deadline date format'
                });
            }
            // Extract date in YYYY-MM-DD format
            deadlineDate = deadlineObj.toISOString().split('T')[0];
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid deadline date format'
            });
        }

        // Get admin ID from the authenticated user (req.user.email)
        const adminEmail = req.user.email;
        const adminCheckSql = `SELECT id FROM admins WHERE email = ?`;
        const adminResult = await query(adminCheckSql, [adminEmail]);

        if (!adminResult || adminResult.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        const assignedBy = adminResult[0].id;
        const createdTask = await createTaskForStaff(title, id, deadlineDate, notes, assignedBy);

        // Get the created task with proper field mapping
        const getTaskSql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, status, created_at FROM tasks WHERE id = ?`;
        const taskResult = await query(getTaskSql, [createdTask.insertId]);

        // Map staff_id to id for API response (API uses 'id' for staff id, task_id for task primary key)
        const taskData = taskResult[0] ? {
            task_id: taskResult[0].task_id,
            title: taskResult[0].title,
            id: taskResult[0].staff_id, // Map staff_id to id for API
            deadline: taskResult[0].deadline,
            notes: taskResult[0].notes,
            assigned_by: taskResult[0].assigned_by,
            assigned_at: taskResult[0].assigned_at,
            status: taskResult[0].status,
            created_at: taskResult[0].created_at
        } : {
            task_id: createdTask.insertId,
            title,
            id: id, // staff id
            deadline,
            notes,
            assigned_by: assignedBy
        };

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: taskData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create task for staff',
            error: error.message
        });
    }
}

export const getAllTasksForStaffController = async (req, res) => {
    const isCompleted = false;
    try {
        const { page = 1, limit = 10, search = "", status = '', id = null } = req.query;

        // id is optional - if not provided, return all tasks
        const result = await getAllTasksForStaff(id, page, limit, search, status, isCompleted);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get all tasks for staff',
            error: error.message
        });
    }
}

// get all completed tasks for staff by admin
export const getAllCompletedTasksForStaffController = async (req, res) => {
    const isCompleted = true;
    try {
        const { page = 1, limit = 10, search = "", status = '', id = null } = req.query;
        const result = await getAllTasksForStaff(id, page, limit, search, status, isCompleted);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get all completed tasks for staff',
            error: error.message
        });
    }
}

export const updateTaskStatusController = async (req, res) => {
    try {
        const { taskId, status, reason } = req.body;

        // Validation: Check if status is valid
        const validStatuses = ['todo', 'in_progress', 'completed', 'blocked'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: todo, in_progress, completed, blocked'
            });
        }

        // Validation: If status is blocked, reason is required
        if (status === 'blocked' && (!notes || notes.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required when status is blocked'
            });
        }

        const updatedTask = await updateTaskStatus(taskId, status, notes);

        // Get the updated task to return complete data
        const getTaskSql = `SELECT id as task_id, title, staff_id, deadline, notes, assigned_by, assigned_at, completed_at, status, created_at FROM tasks WHERE id = ?`;
        const taskResult = await query(getTaskSql, [taskId]);

        if (!taskResult || taskResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Map staff_id to assignee_id for API response
        const taskData = {
            ...taskResult[0],
            task_id: taskResult[0].task_id,
            assignee_id: taskResult[0].staff_id
        };
        delete taskData.staff_id;

        return res.status(200).json({
            success: true,
            message: 'Task status updated successfully',
            data: taskData
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update task status',
            error: error.message
        });
    }
}

export const deleteTaskForStaffController = async (req, res) => {
    try {
        const taskId = req.body.taskId;
        const result = await deleteTaskForStaff(taskId);
        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete task for staff' });
    }
}

export const updateTaskDetailsController = async (req, res) => {
    try {
        const { taskId, title, deadline, notes } = req.body;
        const userRole = req.user?.role;
        const userId = req.user?.id;

        // Validation: taskId is required
        if (!taskId) {
            return res.status(400).json({
                success: false,
                message: 'Task ID is required'
            });
        }

        // Check if at least one field is provided for update
        if (title === undefined && deadline === undefined && notes === undefined) {
            return res.status(400).json({
                success: false,
                message: 'At least one field (title, deadline, or notes) must be provided for update'
            });
        }

        // Check if task exists
        const existingTask = await getTaskById(taskId);
        if (!existingTask) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Validate deadline format if provided
        if (deadline !== undefined && deadline !== null) {
            const deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid deadline format. Please provide a valid date.'
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Title must be a non-empty string'
                });
            }
            updateData.title = title.trim();
        }

        if (deadline !== undefined) {
            updateData.deadline = deadline;
        }

        if (notes !== undefined) {
            // If notes is empty string, remove notes (set to null)
            // If notes has value, update it
            updateData.notes = notes === '' || notes === null ? null : notes;
        }

        // Update task details
        const result = await updateTaskDetails(taskId, updateData);

        // Get updated task with updated_at timestamp
        const updatedTask = await getTaskById(taskId);

        if (!updatedTask) {
            return res.status(500).json({
                success: false,
                message: 'Task updated but could not retrieve updated data'
            });
        }

        // Format response (map staff_id to assignee_id for API consistency)
        const taskData = {
            task_id: updatedTask.task_id,
            title: updatedTask.title,
            assignee_id: updatedTask.staff_id,
            deadline: updatedTask.deadline,
            notes: updatedTask.notes,
            assigned_by: updatedTask.assigned_by,
            assigned_at: updatedTask.assigned_at,
            completed_at: updatedTask.completed_at,
            updated_at: updatedTask.updated_at,
            status: updatedTask.status,
            reason: updatedTask.reason,
            created_at: updatedTask.created_at
        };

        return res.status(200).json({
            success: true,
            message: 'Task details updated successfully',
            data: taskData
        });
    } catch (error) {
        console.error('Error updating task details:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update task details',
            error: error.message
        });
    }
}

export const deleteStaffController = async (req, res) => {
    try {
        const { staffId } = req.body;
        const result = await deleteStaffById(staffId);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }
        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete staff', error: error.message });
    }
}