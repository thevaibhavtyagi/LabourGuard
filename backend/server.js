// 1. MUST BE FIRST: Load environment variables before any other imports
import 'dotenv/config';

// 2. Standard Imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// 3. Local Imports
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import complianceRoutes from './routes/complianceRoutes.js';
import employerRoutes from './routes/employerRoutes.js';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express application
const app = express();

// Middleware Setup
// Middleware Setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : [
        'http://localhost:3000', 'http://127.0.0.1:3000', 
        'http://localhost:5000', 'http://127.0.0.1:5000',
        'http://localhost:5500', 'http://127.0.0.1:5500', // Added: VS Code Live Server
        'http://localhost:5173', 'http://127.0.0.1:5173'  // Added: Vite Development Server
      ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes (Backend)
app.use('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'local-server',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/work', workRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/employer', employerRoutes);

// 4. CLEAN URL FRONTEND SERVING (Local Development Only)
// Vercel handles clean URLs automatically via vercel.json in production.
// Locally, we tell Express to serve the frontend folder and resolve .html automatically.
if (!process.env.VERCEL) {
  const frontendPath = path.join(__dirname, '../frontend');
  
  // Serve static files, stripping the .html extension
  app.use(express.static(frontendPath, { 
    extensions: ['html'], 
    cleanUrls: true 
  }));

  // Route the root local URL directly to the landing page
  app.get('/', (req, res) => {
    res.redirect('/pages/index');
  });
}

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API Endpoint not found' });
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
await connectDB();

// VERCEL injects a process.env.VERCEL environment variable automatically.
// If it exists, we skip app.listen() because Vercel handles the port bindings dynamically.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║        LabourGuard Full-Stack Server           ║
╠════════════════════════════════════════════════╣
║  API & App: http://localhost:${PORT.toString().padEnd(18)}║
║  Clean URL: Active (Extensions Stripped)       ║
║  Mode:      ${(process.env.NODE_ENV || 'development').padEnd(31)}║
╚════════════════════════════════════════════════╝
    `);
  });

  const gracefulShutdown = async () => {
    console.log('⚠ Received kill signal, shutting down gracefully...');
    server.close(async () => {
      try {
        await mongoose.connection.close(false);
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

// CRITICAL FOR VERCEL: Export the app
export default app;