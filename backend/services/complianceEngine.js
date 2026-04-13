/**
 * LabourGuard - Compliance Engine Service
 * 
 * Evaluates labour law compliance based on:
 * 1. Daily working hours (max 9 hours)
 * 2. Weekly working hours (max 48 hours)
 * 3. Break requirements (max 5 hours continuous work)
 * 
 * This is a dedicated service isolated from route handlers.
 */

import WorkLog from '../models/WorkLog.js';
import Violation from '../models/Violation.js';

// ══════════════════════════════════════════════════════════════════
// Constants - Labour Law Limits
// ══════════════════════════════════════════════════════════════════
const LIMITS = {
  DAILY_HOURS: 9,           // Maximum daily working hours
  WEEKLY_HOURS: 48,         // Maximum weekly working hours
  CONTINUOUS_MINUTES: 300,  // Maximum continuous work without break (5 hours)
  BREAK_MINUTES: 30         // Minimum break duration
};

// Severity thresholds (percentage over limit)
const SEVERITY_THRESHOLDS = {
  WARNING: 0.9,  // 90% of limit triggers warning
  VIOLATION: 1.0 // 100% of limit triggers violation
};

// ══════════════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════════════

/**
 * Get start of day in local timezone
 */
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of day in local timezone
 */
const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Get start of week (Monday)
 */
const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of week (Sunday)
 */
const getEndOfWeek = (date = new Date()) => {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Format minutes to human-readable string
 */
const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// ══════════════════════════════════════════════════════════════════
// Core Compliance Evaluation Functions
// ══════════════════════════════════════════════════════════════════

/**
 * Evaluate daily working hours compliance
 * @param {string} userId - User ID
 * @param {Date} date - Date to evaluate
 * @returns {Object} Compliance result
 */
export const evaluateDailyHours = async (userId, date = new Date()) => {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);
  
  // Get all completed work logs for the day
  const workLogs = await WorkLog.find({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'completed'
  });
  
  // Calculate total minutes worked
  const totalMinutes = workLogs.reduce((sum, log) => sum + (log.totalMinutes || 0), 0);
  const totalHours = totalMinutes / 60;
  
  // Determine compliance status
  let status = 'compliant';
  let severity = null;
  let message = null;
  
  if (totalHours >= LIMITS.DAILY_HOURS) {
    status = 'violation';
    severity = 'violation';
    message = `Daily working hours exceeded: ${formatMinutes(totalMinutes)} worked (limit: ${LIMITS.DAILY_HOURS}h)`;
  } else if (totalHours >= LIMITS.DAILY_HOURS * SEVERITY_THRESHOLDS.WARNING) {
    status = 'warning';
    severity = 'warning';
    message = `Approaching daily limit: ${formatMinutes(totalMinutes)} worked (limit: ${LIMITS.DAILY_HOURS}h)`;
  }
  
  return {
    type: 'daily_hours',
    status,
    severity,
    message,
    details: {
      actualHours: parseFloat(totalHours.toFixed(2)),
      limitHours: LIMITS.DAILY_HOURS,
      totalMinutes,
      date: startOfDay
    }
  };
};

/**
 * Evaluate weekly working hours compliance
 * @param {string} userId - User ID
 * @param {Date} date - Date within the week to evaluate
 * @returns {Object} Compliance result
 */
export const evaluateWeeklyHours = async (userId, date = new Date()) => {
  const weekStart = getStartOfWeek(date);
  const weekEnd = getEndOfWeek(date);
  
  // Get all completed work logs for the week
  const workLogs = await WorkLog.find({
    user: userId,
    date: { $gte: weekStart, $lte: weekEnd },
    status: 'completed'
  });
  
  // Calculate total minutes worked
  const totalMinutes = workLogs.reduce((sum, log) => sum + (log.totalMinutes || 0), 0);
  const totalHours = totalMinutes / 60;
  
  // Determine compliance status
  let status = 'compliant';
  let severity = null;
  let message = null;
  
  if (totalHours >= LIMITS.WEEKLY_HOURS) {
    status = 'violation';
    severity = 'violation';
    message = `Weekly working hours exceeded: ${formatMinutes(totalMinutes)} worked (limit: ${LIMITS.WEEKLY_HOURS}h)`;
  } else if (totalHours >= LIMITS.WEEKLY_HOURS * SEVERITY_THRESHOLDS.WARNING) {
    status = 'warning';
    severity = 'warning';
    message = `Approaching weekly limit: ${formatMinutes(totalMinutes)} worked (limit: ${LIMITS.WEEKLY_HOURS}h)`;
  }
  
  return {
    type: 'weekly_hours',
    status,
    severity,
    message,
    details: {
      actualHours: parseFloat(totalHours.toFixed(2)),
      limitHours: LIMITS.WEEKLY_HOURS,
      totalMinutes,
      weekStart,
      weekEnd
    }
  };
};

/**
 * Evaluate break requirement compliance for a work session
 * @param {Object} workLog - Work log document
 * @returns {Object} Compliance result
 */
export const evaluateBreakRequirement = (workLog) => {
  if (!workLog.checkIn || !workLog.checkOut) {
    return {
      type: 'break_requirement',
      status: 'compliant',
      severity: null,
      message: null,
      details: null
    };
  }
  
  const sessionMinutes = workLog.totalMinutes || 0;
  const breaks = workLog.breaks || [];
  
  // Calculate longest continuous work period
  let longestContinuousMinutes = sessionMinutes;
  
  if (breaks.length > 0) {
    // Sort breaks by start time
    const sortedBreaks = [...breaks].sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Calculate continuous work periods between breaks
    let lastEndTime = new Date(workLog.checkIn);
    let maxContinuous = 0;
    
    sortedBreaks.forEach(breakItem => {
      const breakStart = new Date(breakItem.start);
      const continuousMinutes = Math.floor((breakStart - lastEndTime) / 60000);
      maxContinuous = Math.max(maxContinuous, continuousMinutes);
      lastEndTime = new Date(breakItem.end);
    });
    
    // Check time from last break to checkout
    const finalContinuous = Math.floor((new Date(workLog.checkOut) - lastEndTime) / 60000);
    maxContinuous = Math.max(maxContinuous, finalContinuous);
    
    longestContinuousMinutes = maxContinuous;
  }
  
  // Determine compliance status
  let status = 'compliant';
  let severity = null;
  let message = null;
  
  if (longestContinuousMinutes >= LIMITS.CONTINUOUS_MINUTES) {
    status = 'violation';
    severity = 'violation';
    message = `Continuous work exceeded ${LIMITS.CONTINUOUS_MINUTES / 60}h without a break: ${formatMinutes(longestContinuousMinutes)} continuous work`;
  } else if (longestContinuousMinutes >= LIMITS.CONTINUOUS_MINUTES * SEVERITY_THRESHOLDS.WARNING) {
    status = 'warning';
    severity = 'warning';
    message = `Approaching continuous work limit: ${formatMinutes(longestContinuousMinutes)} without break`;
  }
  
  return {
    type: 'break_requirement',
    status,
    severity,
    message,
    details: {
      continuousMinutes: longestContinuousMinutes,
      limitMinutes: LIMITS.CONTINUOUS_MINUTES,
      breaksTaken: breaks.length
    }
  };
};

// ══════════════════════════════════════════════════════════════════
// Comprehensive Compliance Evaluation
// ══════════════════════════════════════════════════════════════════

/**
 * Run full compliance evaluation for a user
 * @param {string} userId - User ID
 * @param {Date} date - Date to evaluate
 * @returns {Object} Full compliance evaluation result
 */
export const evaluateCompliance = async (userId, date = new Date()) => {
  const results = {
    overall: 'compliant',
    evaluatedAt: new Date(),
    checks: [],
    warnings: [],
    violations: []
  };
  
  // Evaluate daily hours
  const dailyResult = await evaluateDailyHours(userId, date);
  results.checks.push(dailyResult);
  
  if (dailyResult.status === 'warning') {
    results.warnings.push(dailyResult);
  } else if (dailyResult.status === 'violation') {
    results.violations.push(dailyResult);
  }
  
  // Evaluate weekly hours
  const weeklyResult = await evaluateWeeklyHours(userId, date);
  results.checks.push(weeklyResult);
  
  if (weeklyResult.status === 'warning') {
    results.warnings.push(weeklyResult);
  } else if (weeklyResult.status === 'violation') {
    results.violations.push(weeklyResult);
  }
  
  // Determine overall status
  if (results.violations.length > 0) {
    results.overall = 'violation';
  } else if (results.warnings.length > 0) {
    results.overall = 'warning';
  }
  
  return results;
};

/**
 * Evaluate compliance after a checkout and record violations
 * @param {string} userId - User ID
 * @param {Object} workLog - The completed work log
 * @returns {Object} Compliance result with recorded violations
 */
export const evaluateAndRecordViolations = async (userId, workLog) => {
  const results = [];
  
  // Evaluate break requirement for this session
  const breakResult = evaluateBreakRequirement(workLog);
  results.push(breakResult);
  
  // Record break violation if any
  if (breakResult.status === 'violation') {
    await recordViolation(userId, workLog._id, {
      type: 'break_requirement_violated',
      severity: breakResult.severity,
      description: breakResult.message,
      details: breakResult.details,
      date: workLog.date
    });
  }
  
  // Evaluate daily hours
  const dailyResult = await evaluateDailyHours(userId, workLog.date);
  results.push(dailyResult);
  
  // Record daily violation if any (only record actual violations, not warnings)
  if (dailyResult.status === 'violation') {
    // Check if we already have a daily violation for this date
    const existingDaily = await Violation.findOne({
      user: userId,
      type: 'daily_hours_exceeded',
      date: {
        $gte: getStartOfDay(workLog.date),
        $lte: getEndOfDay(workLog.date)
      }
    });
    
    if (!existingDaily) {
      await recordViolation(userId, workLog._id, {
        type: 'daily_hours_exceeded',
        severity: dailyResult.severity,
        description: dailyResult.message,
        details: dailyResult.details,
        date: workLog.date
      });
    }
  }
  
  // Evaluate weekly hours
  const weeklyResult = await evaluateWeeklyHours(userId, workLog.date);
  results.push(weeklyResult);
  
  // Record weekly violation if any
  if (weeklyResult.status === 'violation') {
    // Check if we already have a weekly violation for this week
    const existingWeekly = await Violation.findOne({
      user: userId,
      type: 'weekly_hours_exceeded',
      'details.weekStart': getStartOfWeek(workLog.date)
    });
    
    if (!existingWeekly) {
      await recordViolation(userId, workLog._id, {
        type: 'weekly_hours_exceeded',
        severity: weeklyResult.severity,
        description: weeklyResult.message,
        details: weeklyResult.details,
        date: workLog.date
      });
    }
  }
  
  return {
    results,
    hasViolations: results.some(r => r.status === 'violation'),
    hasWarnings: results.some(r => r.status === 'warning')
  };
};

// ══════════════════════════════════════════════════════════════════
// Violation Recording
// ══════════════════════════════════════════════════════════════════

/**
 * Record a violation in the database
 * @param {string} userId - User ID
 * @param {string} workLogId - Associated work log ID
 * @param {Object} violationData - Violation details
 * @returns {Object} Created violation
 */
export const recordViolation = async (userId, workLogId, violationData) => {
  const violation = new Violation({
    user: userId,
    workLog: workLogId,
    type: violationData.type,
    severity: violationData.severity,
    description: violationData.description,
    details: violationData.details,
    date: violationData.date || new Date()
  });
  
  await violation.save();
  return violation;
};

/**
 * Get violations for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (startDate, endDate, type, acknowledged)
 * @returns {Array} List of violations
 */
export const getViolations = async (userId, options = {}) => {
  const query = { user: userId };
  
  if (options.startDate || options.endDate) {
    query.date = {};
    if (options.startDate) query.date.$gte = options.startDate;
    if (options.endDate) query.date.$lte = options.endDate;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.acknowledged !== undefined) {
    query.acknowledged = options.acknowledged;
  }
  
  return Violation.find(query)
    .sort({ date: -1 })
    .limit(options.limit || 50)
    .populate('workLog', 'checkIn checkOut totalMinutes');
};

/**
 * Acknowledge a violation
 * @param {string} violationId - Violation ID
 * @param {string} userId - User ID (for validation)
 * @returns {Object} Updated violation
 */
export const acknowledgeViolation = async (violationId, userId) => {
  const violation = await Violation.findOneAndUpdate(
    { _id: violationId, user: userId },
    { 
      acknowledged: true, 
      acknowledgedAt: new Date() 
    },
    { new: true }
  );
  
  if (!violation) {
    throw new Error('Violation not found');
  }
  
  return violation;
};

// ══════════════════════════════════════════════════════════════════
// Summary Statistics
// ══════════════════════════════════════════════════════════════════

/**
 * Get violation statistics for a user
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for stats
 * @param {Date} endDate - End date for stats
 * @returns {Object} Violation statistics
 */
export const getViolationStats = async (userId, startDate, endDate) => {
  const violations = await Violation.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate }
  });
  
  const stats = {
    total: violations.length,
    byType: {
      daily_hours_exceeded: 0,
      weekly_hours_exceeded: 0,
      break_requirement_violated: 0
    },
    bySeverity: {
      warning: 0,
      violation: 0
    },
    unacknowledged: 0
  };
  
  violations.forEach(v => {
    stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
    stats.bySeverity[v.severity] = (stats.bySeverity[v.severity] || 0) + 1;
    if (!v.acknowledged) stats.unacknowledged++;
  });
  
  return stats;
};

// Export limits for use in other modules
export const COMPLIANCE_LIMITS = LIMITS;

export default {
  evaluateDailyHours,
  evaluateWeeklyHours,
  evaluateBreakRequirement,
  evaluateCompliance,
  evaluateAndRecordViolations,
  recordViolation,
  getViolations,
  acknowledgeViolation,
  getViolationStats,
  COMPLIANCE_LIMITS: LIMITS
};
