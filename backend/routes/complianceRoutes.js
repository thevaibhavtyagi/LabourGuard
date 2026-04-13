/**
 * LabourGuard - Compliance Routes
 * API endpoints for compliance status and violation management
 */

import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import {
  getComplianceStatus,
  getViolations,
  getViolationStats,
  acknowledgeViolation,
  getComplianceOverview,
  getEmployeeViolations
} from '../controllers/complianceController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ══════════════════════════════════════════════════════════════════
// Employee Routes
// ══════════════════════════════════════════════════════════════════

// Get current compliance status
router.get('/status', getComplianceStatus);

// Get violation history
router.get('/violations', getViolations);

// Get violation statistics
router.get('/stats', getViolationStats);

// Acknowledge a violation
router.post('/violations/:id/acknowledge', acknowledgeViolation);

// ══════════════════════════════════════════════════════════════════
// Employer Routes
// ══════════════════════════════════════════════════════════════════

// Get compliance overview for all employees (employer only)
router.get('/overview', restrictTo('employer'), getComplianceOverview);

// Get violations for a specific employee (employer only)
router.get('/employee/:employeeId/violations', restrictTo('employer'), getEmployeeViolations);

export default router;
