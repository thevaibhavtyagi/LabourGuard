// 1. MUST BE FIRST: Load environment variables before any other imports
import 'dotenv/config';

// 2. Standard Imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// 3. Local Imports
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import employerRoutes from './routes/employerRoutes.js';

// Initialize Express application
const app = express();

// Middleware Setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/employer', employerRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Boot Sequence
const PORT = process.env.PORT || 5000;

// Use Top-Level Await (Node 18+ supports this) to ensure DB connects before taking requests
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║        LabourGuard API Server                  ║
╠════════════════════════════════════════════════╣
║  Status:    Running                            ║
║  Port:      ${PORT.toString().padEnd(31)}║
║  Mode:      ${(process.env.NODE_ENV || 'development').padEnd(31)}║
╚════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown for CI/CD Deployments (Render, AWS, Docker, etc.)
const gracefulShutdown = async () => {
  console.log('⚠ Received kill signal, shutting down gracefully...');
  server.close(async () => {
    console.log('✓ HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('✓ MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('✗ Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', gracefulShutdown);  // For local Ctrl+C
process.on('SIGTERM', gracefulShutdown); // For cloud container termination

export default app;