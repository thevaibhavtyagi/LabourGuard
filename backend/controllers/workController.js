import WorkLog from '../models/WorkLog.js';
import complianceEngine from '../services/complianceEngine.js';

/**
 * @desc    Check in to work
 * @route   POST /api/work/checkin
 * @access  Private (Employee)
 */
export const checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's already an active session today
    const activeSession = await WorkLog.findOne({
      user: userId,
      status: 'active',
      date: today
    });
    
    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active work session. Please check out first.'
      });
    }
    
    // Create new work log entry
    const workLog = await WorkLog.create({
      user: userId,
      checkIn: new Date(),
      date: today,
      status: 'active'
    });
    
    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: {
        id: workLog._id,
        checkIn: workLog.checkIn,
        status: workLog.status
      }
    });
    
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in'
    });
  }
};

/**
 * @desc    Check out from work
 * @route   POST /api/work/checkout
 * @access  Private (Employee)
 */
export const checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the active work session
    const workLog = await WorkLog.findOne({
      user: userId,
      status: 'active'
    });
    
    if (!workLog) {
      return res.status(400).json({
        success: false,
        message: 'No active work session found. Please check in first.'
      });
    }
    
    // Update the work log with checkout time
    workLog.checkOut = new Date();
    workLog.status = 'completed';
    workLog.calculateTotalMinutes();
    
    await workLog.save();
    
    // Run compliance evaluation and record any violations
    const complianceResult = await complianceEngine.evaluateAndRecordViolations(userId, workLog);
    
    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: {
        id: workLog._id,
        checkIn: workLog.checkIn,
        checkOut: workLog.checkOut,
        totalMinutes: workLog.totalMinutes,
        status: workLog.status,
        compliance: {
          hasViolations: complianceResult.hasViolations,
          hasWarnings: complianceResult.hasWarnings,
          results: complianceResult.results
        }
      }
    });
    
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out'
    });
  }
};

/**
 * @desc    Get current active session
 * @route   GET /api/work/session
 * @access  Private (Employee)
 */
export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const activeSession = await WorkLog.findOne({
      user: userId,
      status: 'active'
    });
    
    res.status(200).json({
      success: true,
      data: activeSession ? {
        id: activeSession._id,
        checkIn: activeSession.checkIn,
        status: activeSession.status
      } : null
    });
    
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session'
    });
  }
};

/**
 * @desc    Get work logs for the current user
 * @route   GET /api/work/logs
 * @access  Private (Employee)
 */
export const getWorkLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;
    
    const query = { user: userId };
    
    // Add date filters if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }
    
    const workLogs = await WorkLog.find(query)
      .sort({ date: -1, checkIn: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: workLogs.length,
      data: workLogs.map(log => ({
        id: log._id,
        date: log.date,
        checkIn: log.checkIn,
        checkOut: log.checkOut,
        totalMinutes: log.totalMinutes,
        status: log.status
      }))
    });
    
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get work logs'
    });
  }
};

/**
 * @desc    Get daily summary for current user
 * @route   GET /api/work/summary/daily
 * @access  Private (Employee)
 */
export const getDailySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const logs = await WorkLog.find({
      user: userId,
      date: targetDate
    });
    
    const totalMinutes = logs.reduce((sum, log) => sum + (log.totalMinutes || 0), 0);
    const activeSession = logs.find(log => log.status === 'active');
    
    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        remainingMinutes: totalMinutes % 60,
        sessionsCount: logs.length,
        hasActiveSession: !!activeSession,
        activeSessionCheckIn: activeSession?.checkIn || null
      }
    });
    
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily summary'
    });
  }
};

/**
 * @desc    Get weekly summary for current user
 * @route   GET /api/work/summary/weekly
 * @access  Private (Employee)
 */
export const getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get start of current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const logs = await WorkLog.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek }
    });
    
    // Calculate daily totals
    const dailyTotals = {};
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dailyTotals[days[i]] = 0;
    }
    
    logs.forEach(log => {
      const logDay = new Date(log.date);
      const dayIndex = (logDay.getDay() + 6) % 7; // Convert to Monday = 0
      dailyTotals[days[dayIndex]] += log.totalMinutes || 0;
    });
    
    const totalMinutes = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);
    
    res.status(200).json({
      success: true,
      data: {
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        remainingMinutes: totalMinutes % 60,
        dailyTotals,
        daysWorked: Object.values(dailyTotals).filter(v => v > 0).length
      }
    });
    
  } catch (error) {
    console.error('Weekly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly summary'
    });
  }
};
