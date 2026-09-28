import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from '../server/config/db.js';
import attendanceRoutes from '../server/routes/attendanceRoutes.js';
import employeeRoutes from '../server/routes/employeeRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB once (cached between invocations)
let isConnected = false;
async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

// Middleware to ensure DB is connected
app.use(async (_req, _res, next) => {
  await ensureDB();
  next();
});

// API Routes
app.use('/api/attendance', attendanceRoutes);
app.use('/api', employeeRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString(), database: 'connected' });
});

export default app;
