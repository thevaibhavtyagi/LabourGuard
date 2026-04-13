/**
 * LabourGuard - Employee Dashboard
 * Handles check-in/check-out, timer, and work log display
 */

import { requireAuth, getUser, clearAuth, hasRole } from '../core/auth.js';
import { get, post } from '../core/api.js';

// Require authentication - redirect to login if not authenticated
if (!requireAuth('/pages/login.html')) {
  throw new Error('Authentication required');
}

// Redirect employers to their dashboard
if (hasRole('employer')) {
  window.location.href = 'employer-dashboard.html';
  throw new Error('Redirecting to employer dashboard');
}

// ══════════════════════════════════════════════════════════════════
// DOM Elements
// ══════════════════════════════════════════════════════════════════
const loadingOverlay = document.getElementById('loading-overlay');
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const userAvatarEl = document.getElementById('user-avatar');
const welcomeNameEl = document.getElementById('welcome-name');
const currentDateEl = document.getElementById('current-date');
const logoutBtn = document.getElementById('logout-btn');

// Timer elements
const timerDisplay = document.getElementById('timer-display');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const checkInBtn = document.getElementById('checkin-btn');
const checkOutBtn = document.getElementById('checkout-btn');
const checkInInfo = document.getElementById('check-in-info');
const checkInTimeEl = document.getElementById('check-in-time');

// Stats elements
const dailyHoursEl = document.getElementById('daily-hours');
const dailyMinutesEl = document.getElementById('daily-minutes');
const weeklyHoursEl = document.getElementById('weekly-hours');
const weeklyMinutesEl = document.getElementById('weekly-minutes');
const sessionsCountEl = document.getElementById('sessions-count');
const daysWorkedEl = document.getElementById('days-worked');

// Weekly chart elements
const weeklyChartEl = document.getElementById('weekly-chart');
const totalWeeklyHoursEl = document.getElementById('total-weekly-hours');
const dailyAverageEl = document.getElementById('daily-average');
const remainingHoursEl = document.getElementById('remaining-hours');

// Activity list
const activityListEl = document.getElementById('activity-list');

// Compliance elements
const complianceBadge = document.getElementById('compliance-badge');
const complianceStatusText = document.getElementById('compliance-status-text');
const dailyCheck = document.getElementById('daily-check');
const dailyStatus = document.getElementById('daily-status');
const dailyCurrent = document.getElementById('daily-current');
const dailyProgress = document.getElementById('daily-progress');
const weeklyCheck = document.getElementById('weekly-check');
const weeklyStatus = document.getElementById('weekly-status');
const weeklyCurrent = document.getElementById('weekly-current');
const weeklyProgress = document.getElementById('weekly-progress');
const violationsCountEl = document.getElementById('violations-count');
const violationsListEl = document.getElementById('violations-list');

// Alert elements
const alertBanner = document.getElementById('alert-banner');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertClose = document.getElementById('alert-close');

// ══════════════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════════════
let isWorking = false;
let checkInTime = null;
let timerInterval = null;
let currentSessionMinutes = 0;

// ══════════════════════════════════════════════════════════════════
// Initialization
// ══════════════════════════════════════════════════════════════════
const user = getUser();

// Set user info in UI
if (user) {
  userNameEl.textContent = user.name;
  userRoleEl.textContent = user.role;
  welcomeNameEl.textContent = user.name.split(' ')[0];
  userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
}

// Set current date
const today = new Date();
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
currentDateEl.textContent = today.toLocaleDateString('en-US', dateOptions);

// ══════════════════════════════════════════════════════════════════
// Alert Functions
// ══════════════════════════════════════════════════════════════════
const showAlert = (type, title, message) => {
  alertBanner.className = `alert-banner show ${type}`;
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    hideAlert();
  }, 5000);
};

const hideAlert = () => {
  alertBanner.classList.remove('show');
};

alertClose.addEventListener('click', hideAlert);

// ══════════════════════════════════════════════════════════════════
// Timer Functions
// ══════════════════════════════════════════════════════════════════
const formatTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimeShort = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const startTimer = (startTime) => {
  checkInTime = new Date(startTime);
  isWorking = true;
  
  // Update UI
  statusIndicator.className = 'status-indicator active';
  statusText.textContent = 'Working';
  checkInBtn.style.display = 'none';
  checkOutBtn.style.display = 'flex';
  checkInInfo.style.display = 'inline-block';
  checkInTimeEl.textContent = formatTimeShort(checkInTime);
  
  // Start timer interval
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
};

const stopTimer = () => {
  isWorking = false;
  checkInTime = null;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Update UI
  statusIndicator.className = 'status-indicator idle';
  statusText.textContent = 'Not Working';
  checkInBtn.style.display = 'flex';
  checkOutBtn.style.display = 'none';
  checkInInfo.style.display = 'none';
  timerDisplay.textContent = '00:00:00';
};

const updateTimer = () => {
  if (!checkInTime) return;
  
  const now = new Date();
  const diff = Math.floor((now - checkInTime) / 1000);
  timerDisplay.textContent = formatTime(diff);
  currentSessionMinutes = Math.floor(diff / 60);
};

// ══════════════════════════════════════════════════════════════════
// API Functions
// ══════════════════════════════════════════════════════════════════
const checkActiveSession = async () => {
  try {
    const response = await get('/work/session');
    if (response.success && response.data) {
      startTimer(response.data.checkIn);
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
};

const handleCheckIn = async () => {
  checkInBtn.disabled = true;
  checkInBtn.innerHTML = '<span class="spinner"></span> Checking in...';
  
  try {
    const response = await post('/work/checkin');
    
    if (response.success) {
      startTimer(response.data.checkIn);
      showAlert('success', 'Checked In', 'You have successfully checked in. Have a productive day!');
      await loadDashboardData();
    }
  } catch (error) {
    showAlert('error', 'Check-in Failed', error.message || 'Failed to check in. Please try again.');
  } finally {
    checkInBtn.disabled = false;
    checkInBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Check In
    `;
  }
};

const handleCheckOut = async () => {
  checkOutBtn.disabled = true;
  checkOutBtn.innerHTML = '<span class="spinner"></span> Checking out...';
  
  try {
    const response = await post('/work/checkout');
    
    if (response.success) {
      const hours = Math.floor(response.data.totalMinutes / 60);
      const minutes = response.data.totalMinutes % 60;
      
      stopTimer();
      
      // Check compliance results and show appropriate alert
      const compliance = response.data.compliance;
      if (compliance?.hasViolations) {
        showAlert('error', 'Compliance Violation', 
          `Session complete (${hours}h ${minutes}m). You have exceeded working hour limits. Please review the compliance section.`);
      } else if (compliance?.hasWarnings) {
        showAlert('warning', 'Compliance Warning', 
          `Session complete (${hours}h ${minutes}m). You are approaching working hour limits.`);
      } else {
        showAlert('success', 'Checked Out', `Great work! You worked ${hours}h ${minutes}m today.`);
      }
      
      await loadDashboardData();
    }
  } catch (error) {
    showAlert('error', 'Check-out Failed', error.message || 'Failed to check out. Please try again.');
  } finally {
    checkOutBtn.disabled = false;
    checkOutBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="15"></line>
        <line x1="15" y1="9" x2="9" y2="15"></line>
      </svg>
      Check Out
    `;
  }
};

const loadDailySummary = async () => {
  try {
    const response = await get('/work/summary/daily');
    
    if (response.success) {
      const data = response.data;
      dailyHoursEl.textContent = data.totalHours || 0;
      dailyMinutesEl.textContent = data.remainingMinutes || 0;
      sessionsCountEl.textContent = data.sessionsCount || 0;
    }
  } catch (error) {
    console.error('Error loading daily summary:', error);
  }
};

const loadWeeklySummary = async () => {
  try {
    const response = await get('/work/summary/weekly');
    
    if (response.success) {
      const data = response.data;
      
      // Update weekly stats
      weeklyHoursEl.textContent = data.totalHours || 0;
      weeklyMinutesEl.textContent = data.remainingMinutes || 0;
      daysWorkedEl.textContent = data.daysWorked || 0;
      
      // Update summary
      totalWeeklyHoursEl.textContent = `${data.totalHours || 0}h ${data.remainingMinutes || 0}m`;
      
      // Calculate daily average
      const avgMinutes = data.daysWorked > 0 ? Math.floor(data.totalMinutes / data.daysWorked) : 0;
      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = avgMinutes % 60;
      dailyAverageEl.textContent = `${avgHours}h ${avgMins}m`;
      
      // Calculate remaining hours (48h limit)
      const remainingMinutes = Math.max(0, (48 * 60) - data.totalMinutes);
      const remHours = Math.floor(remainingMinutes / 60);
      const remMins = remainingMinutes % 60;
      remainingHoursEl.textContent = `${remHours}h ${remMins}m`;
      
      // Update remaining hours color
      if (remainingMinutes < 480) { // Less than 8 hours
        remainingHoursEl.className = 'summary-value warning';
      } else {
        remainingHoursEl.className = 'summary-value success';
      }
      
      // Render weekly chart
      renderWeeklyChart(data.dailyTotals);
    }
  } catch (error) {
    console.error('Error loading weekly summary:', error);
  }
};

const renderWeeklyChart = (dailyTotals) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxHours = 9; // 9 hours is the daily limit
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  
  let chartHTML = '';
  
  days.forEach((day, index) => {
    const minutes = dailyTotals[day] || 0;
    const hours = minutes / 60;
    const percentage = Math.min((hours / maxHours) * 100, 100);
    const isToday = index === todayIndex;
    const isOvertime = hours > 9;
    
    const displayHours = Math.floor(hours);
    const displayMinutes = Math.floor(minutes % 60);
    const displayValue = hours > 0 ? `${displayHours}h${displayMinutes > 0 ? ` ${displayMinutes}m` : ''}` : '';
    
    chartHTML += `
      <div class="chart-bar-container">
        <div class="chart-bar-wrapper">
          <div class="chart-bar ${hours > 0 ? 'has-hours' : ''} ${isOvertime ? 'overtime' : ''}" style="height: ${Math.max(percentage, 3)}%">
            ${displayValue ? `<span class="chart-bar-value">${displayValue}</span>` : ''}
          </div>
        </div>
        <span class="chart-label ${isToday ? 'today' : ''}">${day}</span>
      </div>
    `;
  });
  
  weeklyChartEl.innerHTML = chartHTML;
};

const loadRecentActivity = async () => {
  try {
    const response = await get('/work/logs?limit=5');
    
    if (response.success && response.data.length > 0) {
      let activityHTML = '';
      
      response.data.forEach(log => {
        const date = new Date(log.date);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const checkInTime = formatTimeShort(log.checkIn);
        const checkOutTime = log.checkOut ? formatTimeShort(log.checkOut) : 'Active';
        
        const hours = Math.floor((log.totalMinutes || 0) / 60);
        const minutes = (log.totalMinutes || 0) % 60;
        const durationStr = log.status === 'completed' ? `${hours}h ${minutes}m` : 'In Progress';
        
        activityHTML += `
          <div class="activity-item">
            <div class="activity-icon ${log.status === 'active' ? 'checkin' : 'checkout'}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${log.status === 'active' 
                  ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
                  : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
                }
              </svg>
            </div>
            <div class="activity-details">
              <div class="activity-title">${dateStr}</div>
              <div class="activity-time">${checkInTime} - ${checkOutTime}</div>
            </div>
            <div class="activity-duration">
              <div class="duration-value">${durationStr}</div>
              <div class="duration-label">${log.status === 'active' ? 'Current' : 'Duration'}</div>
            </div>
          </div>
        `;
      });
      
      activityListEl.innerHTML = activityHTML;
    } else {
      activityListEl.innerHTML = `
        <div class="empty-activity">
          <div class="empty-activity-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <p>No recent activity. Check in to start tracking your work hours.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading activity:', error);
  }
};

// ══════════════════════════════════════════════════════════════════
// Compliance Functions
// ══════════════════════════════════════════════════════════════════

const loadComplianceStatus = async () => {
  try {
    const response = await get('/compliance/status');
    
    if (response.success) {
      const data = response.data;
      
      // Update overall status badge
      updateComplianceBadge(data.overall);
      
      // Update daily check
      if (data.daily) {
        updateComplianceCheck(
          'daily',
          data.daily.status,
          data.daily.details?.actualHours || 0,
          data.daily.details?.limitHours || 9
        );
      }
      
      // Update weekly check
      if (data.weekly) {
        updateComplianceCheck(
          'weekly',
          data.weekly.status,
          data.weekly.details?.actualHours || 0,
          data.weekly.details?.limitHours || 48
        );
      }
      
      // Load violations if any
      if (data.unacknowledgedCount > 0) {
        await loadViolations();
      }
    }
  } catch (error) {
    console.error('Error loading compliance status:', error);
  }
};

const updateComplianceBadge = (status) => {
  complianceBadge.className = `compliance-status-badge ${status}`;
  
  let iconSvg = '';
  let statusText = '';
  
  switch (status) {
    case 'compliant':
      iconSvg = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
      statusText = 'Compliant';
      break;
    case 'warning':
      iconSvg = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';
      statusText = 'Warning';
      break;
    case 'violation':
      iconSvg = '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
      statusText = 'Violation';
      break;
  }
  
  complianceBadge.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${iconSvg}
    </svg>
    <span>${statusText}</span>
  `;
};

const updateComplianceCheck = (type, status, current, limit) => {
  const checkEl = type === 'daily' ? dailyCheck : weeklyCheck;
  const statusEl = type === 'daily' ? dailyStatus : weeklyStatus;
  const currentEl = type === 'daily' ? dailyCurrent : weeklyCurrent;
  const progressEl = type === 'daily' ? dailyProgress : weeklyProgress;
  
  // Update check card class
  checkEl.className = `compliance-check ${status}`;
  
  // Update status badge
  statusEl.className = `compliance-check-status ${status}`;
  statusEl.textContent = status === 'compliant' ? 'OK' : status === 'warning' ? 'Warning' : 'Exceeded';
  
  // Update current value
  const hours = Math.floor(current);
  const minutes = Math.round((current - hours) * 60);
  currentEl.textContent = `${hours}h ${minutes}m`;
  
  // Update progress bar
  const percentage = Math.min((current / limit) * 100, 100);
  progressEl.style.width = `${percentage}%`;
  progressEl.className = `compliance-progress-bar ${status}`;
};

const loadViolations = async () => {
  try {
    const response = await get('/compliance/violations?acknowledged=false&limit=5');
    
    if (response.success && response.data.length > 0) {
      // Show violations count
      violationsCountEl.textContent = response.data.length;
      violationsCountEl.style.display = 'inline-block';
      
      // Render violations
      let violationsHTML = '';
      
      response.data.forEach(violation => {
        const date = new Date(violation.date);
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const iconClass = violation.severity === 'warning' ? 'warning' : 'violation';
        const iconSvg = violation.severity === 'warning'
          ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>';
        
        violationsHTML += `
          <div class="violation-item" data-id="${violation._id}">
            <div class="violation-icon ${iconClass}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${iconSvg}
              </svg>
            </div>
            <div class="violation-content">
              <div class="violation-message">${violation.description}</div>
              <div class="violation-time">${dateStr}</div>
            </div>
            <button class="violation-acknowledge" onclick="acknowledgeViolation('${violation._id}')">
              Acknowledge
            </button>
          </div>
        `;
      });
      
      violationsListEl.innerHTML = violationsHTML;
    } else {
      // No violations
      violationsCountEl.style.display = 'none';
      violationsListEl.innerHTML = `
        <div class="no-violations">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>No violations recorded. Keep up the good work!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading violations:', error);
  }
};

// Global function for acknowledging violations
window.acknowledgeViolation = async (violationId) => {
  try {
    const response = await post(`/compliance/violations/${violationId}/acknowledge`);
    
    if (response.success) {
      showAlert('success', 'Acknowledged', 'Violation has been acknowledged.');
      await loadComplianceStatus();
    }
  } catch (error) {
    showAlert('error', 'Error', 'Failed to acknowledge violation.');
  }
};

const loadDashboardData = async () => {
  await Promise.all([
    loadDailySummary(),
    loadWeeklySummary(),
    loadRecentActivity(),
    loadComplianceStatus()
  ]);
};

// ══════════════════════════════════════════════════════════════════
// Event Listeners
// ══════════════════════════════════════════════════════════════════
checkInBtn.addEventListener('click', handleCheckIn);
checkOutBtn.addEventListener('click', handleCheckOut);

logoutBtn.addEventListener('click', () => {
  if (isWorking) {
    if (!confirm('You have an active work session. Are you sure you want to logout without checking out?')) {
      return;
    }
  }
  clearAuth();
  window.location.href = 'login.html';
});

// ══════════════════════════════════════════════════════════════════
// Initialize Dashboard
// ══════════════════════════════════════════════════════════════════
const initDashboard = async () => {
  try {
    await checkActiveSession();
    await loadDashboardData();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    showAlert('error', 'Error', 'Failed to load dashboard data. Please refresh the page.');
  } finally {
    loadingOverlay.classList.add('hidden');
  }
};

// Start initialization
initDashboard();

console.log('LabourGuard Employee Dashboard Loaded');
