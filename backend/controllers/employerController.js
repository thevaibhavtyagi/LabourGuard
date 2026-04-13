/**
 * LabourGuard - Employer Controller
 * Handles employer-specific endpoints for employee management and analytics
 */

import User from '../models/User.js';
import WorkLog from '../models/WorkLog.js';
import Violation from '../models/Violation.js';

/**
 * Get all employees with their work summary
 * @route GET /api/employer/employees
 */
export const getEmployees = async (req, res) => {
  try {
    // Get all active employees
    const employees = await User.find({ role: 'employee', isActive: true })
      .select('_id name email createdAt');
    
    // Get work summaries for each employee
    const employeesWithSummary = await Promise.all(
      employees.map(async (employee) => {
        // Get today's work logs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayLogs = await WorkLog.find({
          user: employee._id,
          checkIn: { $gte: today, $lt: tomorrow }
        });
        
        // Calculate today's hours
        let todayMinutes = 0;
        let isCheckedIn = false;
        
        todayLogs.forEach(log => {
          if (log.status === 'completed') {
            todayMinutes += log.totalMinutes || 0;
          } else if (log.status === 'active') {
            isCheckedIn = true;
            // Calculate time so far for active session
            const now = new Date();
            const elapsed = Math.floor((now - log.checkIn) / 60000);
            todayMinutes += elapsed;
          }
        });
        
        // Get this week's hours
        const startOfWeek = new Date(today);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        
        const weekLogs = await WorkLog.find({
          user: employee._id,
          checkIn: { $gte: startOfWeek },
          status: 'completed'
        });
        
        let weekMinutes = todayMinutes;
        weekLogs.forEach(log => {
          if (log.checkIn >= today) return; // Don't double count today
          weekMinutes += log.totalMinutes || 0;
        });
        
        // Get violation count
        const violationCount = await Violation.countDocuments({
          user: employee._id,
          acknowledged: false
        });
        
        return {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          joinedAt: employee.createdAt,
          todayHours: (todayMinutes / 60).toFixed(1),
          weekHours: (weekMinutes / 60).toFixed(1),
          isCheckedIn,
          violationCount,
          status: violationCount > 0 ? 'violation' : (weekMinutes / 60) > 40 ? 'warning' : 'compliant'
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: employeesWithSummary,
      count: employeesWithSummary.length
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employees'
    });
  }
};

/**
 * Get detailed work logs for a specific employee
 * @route GET /api/employer/employees/:id/logs
 */
export const getEmployeeWorkLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;
    
    // Verify employee exists
    const employee = await User.findById(id).select('name email');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Build query
    const query = { user: id };
    
    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    }
    
    const logs = await WorkLog.find(query)
      .sort({ checkIn: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email
        },
        logs: logs.map(log => ({
          id: log._id,
          checkIn: log.checkIn,
          checkOut: log.checkOut,
          totalMinutes: log.totalMinutes,
          status: log.status
        }))
      }
    });
  } catch (error) {
    console.error('Get employee work logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee work logs'
    });
  }
};

/**
 * Get analytics summary for employer dashboard
 * @route GET /api/employer/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Get all employees
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    
    // Get employees with work logs in period
    const activeEmployees = await WorkLog.distinct('user', {
      checkIn: { $gte: startDate, $lte: endDate }
    });
    
    // Get all work logs in period
    const workLogs = await WorkLog.find({
      checkIn: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });
    
    // Calculate total hours
    let totalMinutes = 0;
    workLogs.forEach(log => {
      totalMinutes += log.totalMinutes || 0;
    });
    
    // Get violations in period
    const violations = await Violation.countDocuments({
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Get violations by type
    const violationsByType = await Violation.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get daily breakdown for chart
    const dailyData = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayLogs = workLogs.filter(log => {
        const logDate = new Date(log.checkIn);
        return logDate >= dayStart && logDate <= dayEnd;
      });
      
      let dayMinutes = 0;
      dayLogs.forEach(log => {
        dayMinutes += log.totalMinutes || 0;
      });
      
      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        hours: (dayMinutes / 60).toFixed(1),
        sessions: dayLogs.length
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Currently checked in employees
    const checkedInCount = await WorkLog.countDocuments({ status: 'active' });
    
    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        summary: {
          totalEmployees,
          activeEmployees: activeEmployees.length,
          totalHours: (totalMinutes / 60).toFixed(1),
          averageHoursPerEmployee: totalEmployees > 0 
            ? ((totalMinutes / 60) / totalEmployees).toFixed(1) 
            : '0.0',
          totalSessions: workLogs.length,
          violations,
          checkedInNow: checkedInCount
        },
        violationsByType: violationsByType.reduce((acc, v) => {
          acc[v._id] = v.count;
          return acc;
        }, {}),
        dailyData
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics'
    });
  }
};

/**
 * Get recent violations across all employees
 * @route GET /api/employer/violations
 */
export const getAllViolations = async (req, res) => {
  try {
    const { limit = 20, acknowledged } = req.query;
    
    const query = {};
    if (acknowledged !== undefined) {
      query.acknowledged = acknowledged === 'true';
    }
    
    const violations = await Violation.find(query)
      .populate('user', 'name email')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: violations.map(v => ({
        id: v._id,
        employee: {
          id: v.user._id,
          name: v.user.name,
          email: v.user.email
        },
        type: v.type,
        severity: v.severity,
        description: v.description,
        date: v.date,
        acknowledged: v.acknowledged,
        acknowledgedAt: v.acknowledgedAt
      })),
      count: violations.length
    });
  } catch (error) {
    console.error('Get all violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve violations'
    });
  }
};

export default {
  getEmployees,
  getEmployeeWorkLogs,
  getAnalytics,
  getAllViolations
};
