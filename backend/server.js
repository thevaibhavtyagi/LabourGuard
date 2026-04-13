import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import employerRoutes from './routes/employerRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express application
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'LabourGuard API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/employer', employerRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        LabourGuard API Server                  ║
╠════════════════════════════════════════════════╣
║  Status:    Running                            ║
║  Port:      ${PORT}                               ║
║  Mode:      ${process.env.NODE_ENV || 'development'}                      ║
╚════════════════════════════════════════════════╝
  `);
});

export default app;
