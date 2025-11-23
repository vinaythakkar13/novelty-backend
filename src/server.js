import app from './app.js';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { createOrderTable, createOrderProductsTable } from './models/OrderModel.js';
import { createStaffTable } from './models/Staff.js';
import { createTaskTable } from './models/TaskModel.js';
import { createAdminTable } from './models/AdminModel.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await pool.getConnection();
    console.log("✅ DB connected");

    // ✅ CREATE TABLES HERE (create parent tables first)
    (async () => {
      // create admins and staff first because other tables depend on them
      await createAdminTable();
      await createStaffTable();

      // tasks reference staff and admins
      await createTaskTable();

      // orders reference staff
      await createOrderTable();
      // order_products reference orders
      await createOrderProductsTable();
    })();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.log("❌ Server startup error:", error);
  }
};

startServer();
