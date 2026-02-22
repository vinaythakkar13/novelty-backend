import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import staffRoutes from './routes/staffRoutes.js';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import { setupSwagger } from './config/swagger.js';
import orderRoutes from './routes/orderRoutes.js';
import taskRouter from './routes/taskRouter.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  credentials: true,
  // origin:[ 'http://localhost:3000', 'http://localhost:5173', 'http://192.168.29.191:5173'],
  origin: '*',
}));
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

app.use('/api/auth', authRoutes);

app.use('/api/staff', staffRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/tasks', taskRouter);

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

// write code for from where request is coming localhost:5173 or 192.168.29.191:5173
app.get('/request-origin', (req, res) => {
  const origin = req.headers.origin;
  console.log("Origin:", origin);
  if (origin === 'http://localhost:5173' || origin === 'http://192.168.29.191:5173') {
    res.json({ origin: origin });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
});

export default app;
