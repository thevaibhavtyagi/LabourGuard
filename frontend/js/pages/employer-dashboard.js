/**
 * LabourGuard - Employer Dashboard
 * Full implementation with employee management, analytics, and compliance tracking
 */

import { requireAuth, getUser, clearAuth, hasRole } from '../core/auth.js';
import { get } from '../core/api.js';

// ══════════════════════════════════════════════════════════════════
// Authentication & Authorization
// ══════════════════════════════════════════════════════════════════

// Require authentication - redirect to login if not authenticated
if (!requireAuth('/pages/login.html')) {
  throw new Error('Authentication required');
}

// Redirect employees to their dashboard
if (hasRole('employee')) {
  window.location.href = 'dashboard.html';
  throw new Error('Redirecting to employee dashboard');
}

// Get user data
const user = getUser();

// ══════════════════════════════════════════════════════════════════
// DOM Elements
// ══════════════════════════════════════════════════════════════════

// Header elements
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const periodSelect = document.getElementById('period-select');
const refreshBtn = document.getElementById('refresh-btn');

// Stat elements
const statEmployees = document.getElementById('stat-employees');
const statActive = document.getElementById('stat-active');
const statHours = document.getElementById('stat-hours');
const statAvgHours = document.getElementById('stat-avg-hours');
const statSessions = document.getElementById('stat-sessions');
const statCheckedIn = document.getElementById('stat-checked-in');
const statViolations = document.getElementById('stat-violations');

// Table elements
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const employeesTableBody = document.getElementById('employees-table-body');

// Compliance summary
const complianceCompliant = document.getElementById('compliance-compliant');
const complianceWarning = document.getElementById('compliance-warning');
const complianceViolation = document.getElementById('compliance-violation');

// Chart and violations
const hoursChart = document.getElementById('hours-chart');
const violationsList = document.getElementById('violations-list');

// UI elements
const alertToast = document.getElementById('alert-toast');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const loadingOverlay = document.getElementById('loading-overlay');
const employeeModal = document.getElementById('employee-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// ══════════════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════════════

let employees = [];
let currentFilter = 'all';
let searchTerm = '';

// ══════════════════════════════════════════════════════════════════
// Initialize
// ══════════════════════════════════════════════════════════════════

if (user) {
  userNameEl.textContent = user.name;
  userRoleEl.textContent = user.role;
}

// Handle logout
logoutBtn.addEventListener('click', () => {
  clearAuth();
  window.location.href = 'login.html';
});

// Period change
periodSelect.addEventListener('change', () => {
  loadDashboardData();
});

// Refresh button
refreshBtn.addEventListener('click', () => {
  loadDashboardData();
});

// Search input
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  renderEmployeesTable();
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderEmployeesTable();
  });
});

// Modal close
modalClose.addEventListener('click', () => {
  employeeModal.classList.remove('show');
});

employeeModal.addEventListener('click', (e) => {
  if (e.target === employeeModal) {
    employeeModal.classList.remove('show');
  }
});

// ══════════════════════════════════════════════════════════════════
// UI Helpers
// ══════════════════════════════════════════════════════════════════

const showAlert = (type, title, message) => {
  alertToast.className = `alert-toast show ${type}`;
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  
  setTimeout(() => {
    alertToast.classList.remove('show');
  }, 4000);
};

const setLoading = (loading) => {
  if (loading) {
    loadingOverlay.classList.add('show');
  } else {
    loadingOverlay.classList.remove('show');
  }
};

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// ══════════════════════════════════════════════════════════════════
// Data Loading
// ══════════════════════════════════════════════════════════════════

const loadDashboardData = async () => {
  setLoading(true);
  
  try {
    await Promise.all([
      loadAnalytics(),
      loadEmployees(),
      loadViolations()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showAlert('error', 'Error', 'Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};

const loadAnalytics = async () => {
  try {
    const period = periodSelect.value;
    const response = await get(`/employer/analytics?period=${period}`);
    
    if (response.success) {
      const data = response.data;
      
      // Update stats
      statEmployees.textContent = data.summary.totalEmployees;
      statActive.textContent = `${data.summary.activeEmployees} active this ${period}`;
      statHours.textContent = `${data.summary.totalHours}h`;
      statAvgHours.textContent = `${data.summary.averageHoursPerEmployee}h avg per employee`;
      statSessions.textContent = data.summary.totalSessions;
      statCheckedIn.textContent = `${data.summary.checkedInNow} checked in now`;
      statViolations.textContent = data.summary.violations;
      
      // Render chart
      renderHoursChart(data.dailyData);
    }
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
};

const loadEmployees = async () => {
  try {
    const response = await get('/employer/employees');
    
    if (response.success) {
      employees = response.data;
      
      // Update compliance summary
      const compliant = employees.filter(e => e.status === 'compliant').length;
      const warning = employees.filter(e => e.status === 'warning').length;
      const violation = employees.filter(e => e.status === 'violation').length;
      
      complianceCompliant.textContent = compliant;
      complianceWarning.textContent = warning;
      complianceViolation.textContent = violation;
      
      renderEmployeesTable();
    }
  } catch (error) {
    console.error('Error loading employees:', error);
  }
};

const loadViolations = async () => {
  try {
    const response = await get('/employer/violations?limit=10');
    
    if (response.success && response.data.length > 0) {
      renderViolationsList(response.data);
    } else {
      violationsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>No violations recorded</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading violations:', error);
  }
};

// ══════════════════════════════════════════════════════════════════
// Rendering
// ══════════════════════════════════════════════════════════════════

const renderEmployeesTable = () => {
  // Filter employees
  let filtered = [...employees];
  
  // Apply search
  if (searchTerm) {
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(searchTerm) ||
      e.email.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply status filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(e => e.status === currentFilter);
  }
  
  if (filtered.length === 0) {
    employeesTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
            <p>${searchTerm || currentFilter !== 'all' ? 'No employees match your filters' : 'No employees found'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  filtered.forEach(employee => {
    const initials = getInitials(employee.name);
    const todayHours = parseFloat(employee.todayHours);
    const weekHours = parseFloat(employee.weekHours);
    const isOvertime = weekHours > 48;
    
    html += `
      <tr>
        <td>
          <div class="employee-info">
            <div class="employee-avatar">${initials}</div>
            <div>
              <div class="employee-name">${employee.name}</div>
              <div class="employee-email">${employee.email}</div>
            </div>
          </div>
        </td>
        <td>
          ${employee.isCheckedIn 
            ? '<span class="status-badge active"><span style="width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 2s infinite;"></span> Active</span>'
            : `<span class="status-badge ${employee.status}">${employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}</span>`
          }
        </td>
        <td class="hours-cell">${formatHours(todayHours)}</td>
        <td class="hours-cell ${isOvertime ? 'overtime' : ''}">${formatHours(weekHours)}</td>
        <td>
          ${employee.violationCount > 0 
            ? `<span class="status-badge violation">${employee.violationCount}</span>`
            : '<span style="color: var(--text-secondary);">-</span>'
          }
        </td>
        <td>
          <button class="action-btn" onclick="viewEmployeeDetails('${employee.id}')">View Details</button>
        </td>
      </tr>
    `;
  });
  
  employeesTableBody.innerHTML = html;
};

const renderHoursChart = (dailyData) => {
  // Get last 7 days
  const last7Days = dailyData.slice(-7);
  const maxHours = Math.max(...last7Days.map(d => parseFloat(d.hours)), 1);
  
  let html = '';
  
  last7Days.forEach(day => {
    const hours = parseFloat(day.hours);
    const heightPercent = (hours / maxHours) * 100;
    const date = new Date(day.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    let barClass = '';
    if (hours > 48) barClass = 'violation';
    else if (hours > 40) barClass = 'warning';
    
    html += `
      <div class="chart-bar-wrapper">
        <div class="chart-value">${hours}h</div>
        <div class="chart-bar ${barClass}" style="height: ${Math.max(heightPercent, 5)}%;"></div>
        <div class="chart-label">${dayName}</div>
      </div>
    `;
  });
  
  hoursChart.innerHTML = html;
};

const renderViolationsList = (violations) => {
  let html = '';
  
  violations.forEach(violation => {
    const date = new Date(violation.date);
    const timeAgo = getTimeAgo(date);
    const iconClass = violation.severity === 'critical' ? 'critical' : 'warning';
    const iconSvg = violation.severity === 'critical'
      ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
      : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
    
    html += `
      <div class="violation-item">
        <div class="violation-icon ${iconClass}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${iconSvg}
          </svg>
        </div>
        <div class="violation-content">
          <div class="violation-employee">${violation.employee.name}</div>
          <div class="violation-description">${violation.description}</div>
          <div class="violation-time">${timeAgo}</div>
        </div>
      </div>
    `;
  });
  
  violationsList.innerHTML = html;
};

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ══════════════════════════════════════════════════════════════════
// Employee Details Modal
// ══════════════════════════════════════════════════════════════════

window.viewEmployeeDetails = async (employeeId) => {
  setLoading(true);
  
  try {
    const response = await get(`/employer/employees/${employeeId}/logs?limit=10`);
    
    if (response.success) {
      const { employee, logs } = response.data;
      const initials = getInitials(employee.name);
      
      // Calculate totals from logs
      let totalMinutes = 0;
      logs.forEach(log => {
        if (log.totalMinutes) totalMinutes += log.totalMinutes;
      });
      
      const totalHours = (totalMinutes / 60).toFixed(1);
      const avgSession = logs.length > 0 ? (totalMinutes / logs.length / 60).toFixed(1) : '0';
      
      let logsHtml = '';
      logs.forEach(log => {
        const date = new Date(log.checkIn);
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
        const hours = log.totalMinutes ? (log.totalMinutes / 60).toFixed(1) : '-';
        
        logsHtml += `
          <div class="employee-log-item">
            <span class="employee-log-date">${dateStr}</span>
            <span class="employee-log-hours">${hours}h</span>
          </div>
        `;
      });
      
      if (logs.length === 0) {
        logsHtml = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No work logs found</p>';
      }
      
      modalBody.innerHTML = `
        <div class="employee-detail-header">
          <div class="employee-detail-avatar">${initials}</div>
          <div class="employee-detail-info">
            <h3>${employee.name}</h3>
            <p>${employee.email}</p>
          </div>
        </div>
        
        <div class="employee-stats-grid">
          <div class="employee-stat">
            <div class="employee-stat-label">Total Hours (Recent)</div>
            <div class="employee-stat-value">${totalHours}h</div>
          </div>
          <div class="employee-stat">
            <div class="employee-stat-label">Work Sessions</div>
            <div class="employee-stat-value">${logs.length}</div>
          </div>
          <div class="employee-stat">
            <div class="employee-stat-label">Avg. Session</div>
            <div class="employee-stat-value">${avgSession}h</div>
          </div>
          <div class="employee-stat">
            <div class="employee-stat-label">Status</div>
            <div class="employee-stat-value">${logs.some(l => l.status === 'active') ? 'Active' : 'Idle'}</div>
          </div>
        </div>
        
        <div class="employee-logs-title">Recent Work Logs</div>
        ${logsHtml}
      `;
      
      employeeModal.classList.add('show');
    }
  } catch (error) {
    console.error('Error loading employee details:', error);
    showAlert('error', 'Error', 'Failed to load employee details');
  } finally {
    setLoading(false);
  }
};

// ══════════════════════════════════════════════════════════════════
// Initialize Dashboard
// ══════════════════════════════════════════════════════════════════

loadDashboardData();

// Add CSS animation for active pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

console.log('LabourGuard Employer Dashboard Loaded');
