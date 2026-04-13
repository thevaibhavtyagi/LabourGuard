import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  checkIn,
  checkOut,
  getActiveSession,
  getWorkLogs,
  getDailySummary,
  getWeeklySummary
} from '../controllers/workController.js';

const router = express.Router();

// All routes are protected and require employee role
router.use(protect);
router.use(authorize('employee'));

// Check in/out routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

// Session and logs
router.get('/session', getActiveSession);
router.get('/logs', getWorkLogs);

// Summary routes
router.get('/summary/daily', getDailySummary);
router.get('/summary/weekly', getWeeklySummary);

export default router;
