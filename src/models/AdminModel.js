import { query } from '../config/database.js';
import bcrypt from 'bcrypt';

export const createAdminTable =  async () => {
    const sql =  `CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`

    const result = await query(sql);
    return result;
}

export const createAdmin = async (adminData) => {
    const { name, email, password, is_super_admin = false } = adminData;
    const sql = `INSERT INTO admins (name, email, password, is_super_admin, created_at) VALUES (?, ?, ?, ?, NOW())`;
    const result = await query(sql, [name, email, password, is_super_admin]);
    return result;
}

export const getAdmin = async (email) => {
    const sql = `SELECT * FROM admins WHERE email = ?`;
    const result = await query(sql, [email]);
    return result;
}


// get all admin except logged in admin
export const getAllAdminsExceptLoggedInAdmin = async (email, search) => {
    // search condition can be contain email or name
    let searchCondition = "";
    let params = [];
    if (search.trim() !== "") {
        searchCondition = "AND (email LIKE ? OR name LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    // don't return password, is_super_admin    
    const sql = `SELECT id, name, email, created_at FROM admins WHERE email != ? ${searchCondition}`;
    const result = await query(sql, [email, ...params]);
    return result;
}

export  const updateAdmin = async (adminData) => {
    const { email, password } = adminData;
    const sql = `UPDATE admins SET password = ? WHERE email = ?`;
    const result = await query(sql, [password, email]);
    return result;
}

export const deleteAdmin = async (email) => {
    const sql = `DELETE FROM admins WHERE email = ?`;
    const result = await query(sql, [email]);
    return result;
}

export const adminLoginFunction = async (email, password) => {
    const sql = `SELECT * FROM admins WHERE email = ?`;
    const admin = await getAdmin(email);
    if (!admin.length > 0) {
        return null;
    }
    const isPasswordValid = await bcrypt.compare(password, admin[0].password);
    if (!isPasswordValid) {
        return null;
    }   
    return admin;
}