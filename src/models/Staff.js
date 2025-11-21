import { query } from '../config/database.js';
import { generatePassword, generateStaffId } from '../helper/utils.js';
import bcrypt from 'bcrypt';

export const createStaffTable =  async () => {
  const sql =  `CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  staff_id VARCHAR(255) NOT NULL UNIQUE
  )`

  const result = await query(sql);
  return result;
}

export const getStaff = async (id) => {
  const sql = `SELECT * FROM staff WHERE staff_id = ?`;
  const result = await query(sql, [id]);
  return result;
}

// don't return password, also apply search condition if search is provided, search condition can be contain email or name, phone, status active will return only active staff, inactive staff will be returned if status is  inactive is provided, if all or no status is provided, all staff will be returned
// sort by received params, if sort is not provided, sort by created_at descending, sort is asc then return a-z, sort is desc then return z-a
export const getAllStaffData = async ({ search = "", status = "all", sort = "recent" }) => {
  let sortCondition = "";
  if (sort === "recent") {
    sortCondition = "ORDER BY created_at DESC";
  }
  else if (sort === "oldest") {
    sortCondition = "ORDER BY created_at ASC";
  }
  else if (sort === "a-z") {
    sortCondition = "ORDER BY name ASC";
  }
  else if (sort === "z-a") {
    sortCondition = "ORDER BY name DESC";
  }
  else {
    sortCondition = "ORDER BY created_at DESC";
  }
  let searchCondition = "";
  let params = [];
  if (search.trim() !== "") {
    searchCondition = "WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status !== "all") {
    // Map status to active column (active = true, inactive = false)
    const activeValue = status === "active" ? 1 : 0;
    if (searchCondition) {
      searchCondition += " AND active = ?";
    } else {
      searchCondition = "WHERE active = ?";
    }
    params.push(activeValue);
  }

  const sql = `SELECT id, name, phone, email, active, created_at, staff_id FROM staff ${searchCondition ? " " + searchCondition : ""} ${sortCondition}`;
  const result = await query(sql, [...params]);
  return result;
}

export const isStaffExists = async (email) => {
  const sql = `SELECT * FROM staff WHERE email = ?`;
  const result = await query(sql, [email]);
  return result;
}

export const createStaff = async (staffData) => {
  try {
    // Validate required fields
    const { name, phone, email } = staffData;
    if (!name || !phone || !email) {
      return { success: false, message: 'Name, phone, and email are required' };
    }

    const isStaffExistsResult = await isStaffExists(email);
    if (isStaffExistsResult.length > 0) {
      return { success: false, message: `Staff with this email already exists` };
    }
    
    const staffId = generateStaffId();
    const password = generatePassword();
    const active = true;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use NOW() in SQL instead of passing Date object to avoid timezone issues
    //by default active is true
    const sql = `INSERT INTO staff (name, phone, email, password, active, created_at, staff_id) VALUES (?, ?, ?, ?, ?, NOW(), ?)`;
    const result = await query(sql, [name, phone, email, hashedPassword, active, staffId]);
    
    // For INSERT, mysql2 returns ResultSetHeader object with affectedRows and insertId
    const affectedRows = result?.affectedRows;
    const insertId = result?.insertId;
    
    // Check if insert was successful
    if (!affectedRows || affectedRows === 0) {
      return { success: false, message: `Failed to create staff - no rows affected` };
    }
    
    // Verify the insert by querying the database immediately
    const verifySql = `SELECT id, name, email, phone, staff_id, active FROM staff WHERE id = ?`;
    const verifyResult = await query(verifySql, [insertId]);
    
    if (verifyResult.length === 0) {
      return { success: false, message: `Failed to create staff - data not found after insert` };
    }
    
    return { 
      success: true, 
      message: `Staff ${name} created successfully`,
      data: {
        id: insertId,
        staff_id: staffId,
        name,
        email,
        phone,
        password: password // Return the generated password so it can be sent to the user
      }
    };
  }
  catch (error) {
    return { success: false, message: `Failed to create staff`, error: error.message };
  }
}

// update staff data by id
export const updateStaffData = async (id) => {
// if active is true, set active to false, if active is false, set active to true
  const staff = await getStaff(id);
  if (!staff || staff.length === 0) {
    return { success: false, message: 'Staff not found' };
  }
  const active = staff[0].active;
  const newActive = !active;
  const sql = `UPDATE staff SET active = ? WHERE id = ?`;
  const result = await query(sql, [newActive, id]);
  return { success: true, message: 'Staff updated successfully', data: { active: newActive }   };
}