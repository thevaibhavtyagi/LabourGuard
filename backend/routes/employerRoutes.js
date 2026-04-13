/**
 * LabourGuard - Employer Routes
 * Protected routes for employer-specific functionality
 */

import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getEmployees,
  getEmployeeWorkLogs,
  getAnalytics,
  getAllViolations
} from '../controllers/employerController.js';

const router = express.Router();

// All routes require authentication and employer role
router.use(protect);
router.use(restrictTo('employer'));

// Employee management
router.get('/employees', getEmployees);
router.get('/employees/:id/logs', getEmployeeWorkLogs);

// Analytics
router.get('/analytics', getAnalytics);

// Violations
router.get('/violations', getAllViolations);

export default router;
