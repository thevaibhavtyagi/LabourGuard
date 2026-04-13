/**
 * LabourGuard - Compliance Controller
 * Handles compliance status and violation endpoints
 */

import complianceEngine from '../services/complianceEngine.js';

/**
 * Get current compliance status for the authenticated user
 * @route GET /api/compliance/status
 */
export const getComplianceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Run full compliance evaluation
    const compliance = await complianceEngine.evaluateCompliance(userId);
    
    // Get unacknowledged violations count
    const unacknowledgedViolations = await complianceEngine.getViolations(userId, {
      acknowledged: false,
      limit: 100
    });
    
    res.status(200).json({
      success: true,
      data: {
        overall: compliance.overall,
        evaluatedAt: compliance.evaluatedAt,
        daily: compliance.checks.find(c => c.type === 'daily_hours'),
        weekly: compliance.checks.find(c => c.type === 'weekly_hours'),
        warnings: compliance.warnings,
        violations: compliance.violations,
        unacknowledgedCount: unacknowledgedViolations.length,
        limits: complianceEngine.COMPLIANCE_LIMITS
      }
    });
  } catch (error) {
    console.error('Compliance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to evaluate compliance status'
    });
  }
};

/**
 * Get violations history for the authenticated user
 * @route GET /api/compliance/violations
 * @query startDate - Filter start date
 * @query endDate - Filter end date
 * @query type - Filter by violation type
 * @query acknowledged - Filter by acknowledgment status
 * @query limit - Number of records to return
 */
export const getViolations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, type, acknowledged, limit } = req.query;
    
    const options = {
      limit: parseInt(limit) || 50
    };
    
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    if (type) options.type = type;
    if (acknowledged !== undefined) options.acknowledged = acknowledged === 'true';
    
    const violations = await complianceEngine.getViolations(userId, options);
    
    res.status(200).json({
      success: true,
      data: violations,
      count: violations.length
    });
  } catch (error) {
    console.error('Get violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve violations'
    });
  }
};

/**
 * Get violation statistics for the authenticated user
 * @route GET /api/compliance/stats
 * @query period - 'week', 'month', or 'year'
 */
export const getViolationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const stats = await complianceEngine.getViolationStats(userId, startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        ...stats
      }
    });
  } catch (error) {
    console.error('Get violation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve violation statistics'
    });
  }
};

/**
 * Acknowledge a violation
 * @route POST /api/compliance/violations/:id/acknowledge
 */
export const acknowledgeViolation = async (req, res) => {
  try {
    const userId = req.user.id;
    const violationId = req.params.id;
    
    const violation = await complianceEngine.acknowledgeViolation(violationId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Violation acknowledged',
      data: violation
    });
  } catch (error) {
    console.error('Acknowledge violation error:', error);
    
    if (error.message === 'Violation not found') {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge violation'
    });
  }
};

/**
 * Get compliance summary for employer (all employees)
 * @route GET /api/compliance/overview
 * @access Employer only
 */
export const getComplianceOverview = async (req, res) => {
  try {
    // Import User model here to avoid circular dependency
    const User = (await import('../models/User.js')).default;
    
    // Get all employees
    const employees = await User.find({ role: 'employee', isActive: true })
      .select('_id name email');
    
    const overview = [];
    
    for (const employee of employees) {
      // Get compliance status for each employee
      const compliance = await complianceEngine.evaluateCompliance(employee._id);
      
      // Get recent violations
      const recentViolations = await complianceEngine.getViolations(employee._id, {
        limit: 5,
        acknowledged: false
      });
      
      overview.push({
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email
        },
        status: compliance.overall,
        warningsCount: compliance.warnings.length,
        violationsCount: compliance.violations.length,
        unacknowledgedViolations: recentViolations.length,
        daily: compliance.checks.find(c => c.type === 'daily_hours'),
        weekly: compliance.checks.find(c => c.type === 'weekly_hours')
      });
    }
    
    // Sort by status (violations first, then warnings, then compliant)
    const statusOrder = { violation: 0, warning: 1, compliant: 2 };
    overview.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    
    res.status(200).json({
      success: true,
      data: overview,
      summary: {
        total: overview.length,
        compliant: overview.filter(o => o.status === 'compliant').length,
        warnings: overview.filter(o => o.status === 'warning').length,
        violations: overview.filter(o => o.status === 'violation').length
      }
    });
  } catch (error) {
    console.error('Compliance overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve compliance overview'
    });
  }
};

/**
 * Get violations for a specific employee (employer access)
 * @route GET /api/compliance/employee/:employeeId/violations
 * @access Employer only
 */
export const getEmployeeViolations = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const { startDate, endDate, limit } = req.query;
    
    const options = {
      limit: parseInt(limit) || 50
    };
    
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);
    
    const violations = await complianceEngine.getViolations(employeeId, options);
    
    res.status(200).json({
      success: true,
      data: violations,
      count: violations.length
    });
  } catch (error) {
    console.error('Get employee violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee violations'
    });
  }
};

export default {
  getComplianceStatus,
  getViolations,
  getViolationStats,
  acknowledgeViolation,
  getComplianceOverview,
  getEmployeeViolations
};
