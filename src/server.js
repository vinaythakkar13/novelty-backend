import app from './app.js';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { createOrderTable, createOrderProductsTable } from './models/OrderModel.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await pool.getConnection();
    console.log("✅ DB connected");

    // ✅ CREATE TABLES HERE
    (async () => {
      await createOrderTable();
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
