import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import staffRoutes from './routes/staffRoutes.js';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import { setupSwagger } from './config/swagger.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  credentials: true,
  origin: 'http://localhost:3000',
}));
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

app.use('/api/staff', staffRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/orders', orderRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running and healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server running
 */
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server running' });
});

export default app;
