/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Employee Dashboard Engine (Master Edition)
 * Handles high-fidelity timer, Chart.js telemetry, and API integration
 * ═══════════════════════════════════════════════════════════════
 */

import { requireAuth, getUser, clearAuth, hasRole } from '../core/auth.js';
import { get, post } from '../core/api.js';

// 1. Authorization Gate
if (!requireAuth('/pages/login')) throw new Error('Authentication required');
if (hasRole('employer')) {
  window.location.href = 'employer-dashboard';
  throw new Error('Redirecting to employer dashboard');
}

// 2. DOM Elements Binding
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const welcomeNameEl = document.getElementById('welcome-name');
const currentDateEl = document.getElementById('current-date');
const logoutBtn = document.getElementById('logout-btn');

// Timer Module
const timerCard = document.getElementById('timer-card');
const timerDisplay = document.getElementById('timer-display');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const checkInBtn = document.getElementById('checkin-btn');
const checkOutBtn = document.getElementById('checkout-btn');
const checkInInfo = document.getElementById('check-in-info');
const checkInTimeEl = document.getElementById('check-in-time');

// Stats Module
const dailyHoursDisplay = document.getElementById('daily-hours-display');
const weeklyHoursDisplay = document.getElementById('weekly-hours-display');
const sessionsCountEl = document.getElementById('sessions-count');
const remainingHoursEl = document.getElementById('remaining-hours');

// Activity & Compliance Module
const activityListEl = document.getElementById('activity-list');
const complianceBadge = document.getElementById('compliance-badge');
const dailyProgress = document.getElementById('daily-progress');
const dailyText = document.getElementById('daily-text');
const weeklyProgress = document.getElementById('weekly-progress');
const weeklyText = document.getElementById('weekly-text');
const violationsListEl = document.getElementById('violations-list');

// Alert Banner
const alertBanner = document.getElementById('alert-banner');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertClose = document.getElementById('alert-close');

// Global State
let isWorking = false;
let checkInTime = null;
let timerInterval = null;
let weeklyChartInstance = null;

// 3. Initialization
const user = getUser();
document.addEventListener('DOMContentLoaded', () => {
  if (user) {
    userNameEl.textContent = user.name;
    userRoleEl.textContent = user.role;
    welcomeNameEl.textContent = user.name.split(' ')[0];
  }

  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);

  bindEvents();
  initDashboard();
  triggerEntryAnimations();
});

function triggerEntryAnimations() {
  const elements = document.querySelectorAll('.stagger-enter');
  elements.forEach((el, index) => {
    setTimeout(() => el.classList.add('show'), index * 60);
  });
}

function bindEvents() {
  checkInBtn.addEventListener('click', handleCheckIn);
  checkOutBtn.addEventListener('click', handleCheckOut);
  alertClose.addEventListener('click', () => alertBanner.classList.remove('show'));

  logoutBtn.addEventListener('click', () => {
    if (isWorking && !confirm('Active session detected. Logout without checking out?')) return;
    clearAuth();
    window.location.href = 'login';
  });
}

// 4. Alert & UI Helpers
const showAlert = (type, title, message) => {
  alertBanner.className = `alert-banner show ${type}`;
  alertTitle.textContent = title;
  alertMessage.textContent = message;
  setTimeout(() => alertBanner.classList.remove('show'), 5000);
};

const formatStopwatch = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatTimeShort = (date) => new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// 5. Timer Engine
const startTimer = (startTime) => {
  checkInTime = new Date(startTime);
  isWorking = true;
  
  timerCard.classList.add('is-active');
  statusText.textContent = 'Active Session';
  checkInBtn.style.display = 'none';
  checkOutBtn.style.display = 'flex';
  checkInInfo.style.display = 'inline';
  checkInTimeEl.textContent = formatTimeShort(checkInTime);
  
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  updateTimer();
};

const stopTimer = () => {
  isWorking = false;
  checkInTime = null;
  if (timerInterval) clearInterval(timerInterval);
  
  timerCard.classList.remove('is-active');
  statusText.textContent = 'Idle';
  checkInBtn.style.display = 'flex';
  checkOutBtn.style.display = 'none';
  checkInInfo.style.display = 'none';
  timerDisplay.textContent = '00:00:00';
};

const updateTimer = () => {
  if (!checkInTime) return;
  const diff = Math.floor((new Date() - checkInTime) / 1000);
  timerDisplay.textContent = formatStopwatch(diff);
};

// 6. API Integrations
const checkActiveSession = async () => {
  try {
    const res = await get('/work/session');
    if (res.success && res.data) startTimer(res.data.checkIn);
  } catch (error) { console.error('Session check failed', error); }
};

const handleCheckIn = async () => {
  checkInBtn.disabled = true;
  checkInBtn.innerHTML = 'Verifying...';
  try {
    const res = await post('/work/checkin');
    if (res.success) {
      startTimer(res.data.checkIn);
      showAlert('success', 'Cryptography Verified', 'Session actively logging.');
      await loadDashboardData();
    }
  } catch (error) {
    showAlert('error', 'Check-In Failed', error.message);
  } finally {
    checkInBtn.disabled = false;
    checkInBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Cryptographic Check-In';
  }
};

const handleCheckOut = async () => {
  checkOutBtn.disabled = true;
  checkOutBtn.innerHTML = 'Securing...';
  try {
    const res = await post('/work/checkout');
    if (res.success) {
      const h = Math.floor(res.data.totalMinutes / 60);
      const m = res.data.totalMinutes % 60;
      stopTimer();
      showAlert(res.data.compliance?.hasViolations ? 'error' : 'success', 'Session Secured', `Logged ${h}h ${m}m.`);
      await loadDashboardData();
    }
  } catch (error) {
    showAlert('error', 'Check-Out Failed', error.message);
  } finally {
    checkOutBtn.disabled = false;
    checkOutBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg> Secure Check-Out';
  }
};

// 7. Telemetry & Analytics
const loadDashboardData = async () => {
  await Promise.all([
    loadDailySummary(),
    loadWeeklySummary(),
    loadRecentActivity(),
    loadComplianceStatus()
  ]);
};

const loadDailySummary = async () => {
  const res = await get('/work/summary/daily');
  if (res.success) {
    dailyHoursDisplay.textContent = `${res.data.totalHours || 0}h ${res.data.remainingMinutes || 0}m`;
    sessionsCountEl.textContent = res.data.sessionsCount || 0;
  }
};

const loadWeeklySummary = async () => {
  const res = await get('/work/summary/weekly');
  if (res.success) {
    const { totalHours = 0, remainingMinutes = 0, totalMinutes = 0, dailyTotals } = res.data;
    weeklyHoursDisplay.textContent = `${totalHours}h ${remainingMinutes}m`;
    
    const remMins = Math.max(0, (48 * 60) - totalMinutes);
    remainingHoursEl.textContent = `${Math.floor(remMins/60)}h remaining`;
    remainingHoursEl.style.color = remMins < 480 ? 'var(--color-warning)' : 'var(--color-success)';
    
    renderHighFidelityChart(dailyTotals || {});
  }
};

const renderHighFidelityChart = (dailyTotals) => {
  const ctx = document.getElementById('weeklyChartCanvas').getContext('2d');
  if (weeklyChartInstance) weeklyChartInstance.destroy();

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dataPoints = labels.map(day => (dailyTotals[day] || 0) / 60);

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  const barColors = dataPoints.map(val => val > 9 ? '#ef4444' : '#4f46e5');

  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Hours', data: dataPoints, backgroundColor: barColors, borderRadius: 6, barPercentage: 0.5 },
        { type: 'line', label: 'Trend', data: dataPoints, borderColor: '#3730A3', backgroundColor: gradient, tension: 0.4, fill: true, pointRadius: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
        y: { border: { display: false }, grid: { borderDash: [5, 5] }, ticks: { font: { family: 'JetBrains Mono', size: 10 } } }
      }
    }
  });
};

const loadRecentActivity = async () => {
  const res = await get('/work/logs?limit=5');
  if (res.success && res.data.length > 0) {
    activityListEl.innerHTML = res.data.map(log => {
      const isCheckIn = log.status === 'active';
      const duration = isCheckIn ? 'In Progress' : `${Math.floor(log.totalMinutes/60)}h ${log.totalMinutes%60}m`;
      return `
        <div class="feed-item">
          <div class="feed-icon ${isCheckIn ? 'in' : 'out'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${isCheckIn ? '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>' : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'}
            </svg>
          </div>
          <div class="feed-content">
            <h4>${formatTimeShort(log.checkIn)} - ${log.checkOut ? formatTimeShort(log.checkOut) : 'Now'}</h4>
            <p>${new Date(log.date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</p>
          </div>
          <div class="feed-time">${duration}</div>
        </div>
      `;
    }).join('');
  }
};

const loadComplianceStatus = async () => {
  const res = await get('/compliance/status');
  if (res.success) {
    const d = res.data;
    
    // Overall badge
    complianceBadge.className = `status-pill ${d.overall === 'compliant' ? 'safe' : d.overall === 'warning' ? 'warn' : 'danger'}`;
    complianceBadge.innerHTML = d.overall === 'compliant' ? 'Verified Safe' : 'Flagged';
    
    // Daily Bar
    if (d.daily) {
      const h = d.daily.details?.actualHours || 0;
      const limit = d.daily.details?.limitHours || 9;
      const pct = Math.min((h / limit) * 100, 100);
      dailyText.textContent = `${h.toFixed(1)}h / ${limit}h`;
      dailyProgress.style.width = `${pct}%`;
      dailyProgress.className = `progress-fill ${d.daily.status === 'compliant' ? 'safe' : d.daily.status === 'warning' ? 'warn' : 'danger'}`;
    }

    // Weekly Bar
    if (d.weekly) {
      const h = d.weekly.details?.actualHours || 0;
      const limit = d.weekly.details?.limitHours || 48;
      const pct = Math.min((h / limit) * 100, 100);
      weeklyText.textContent = `${h.toFixed(1)}h / ${limit}h`;
      weeklyProgress.style.width = `${pct}%`;
      weeklyProgress.className = `progress-fill ${d.weekly.status === 'compliant' ? 'safe' : d.weekly.status === 'warning' ? 'warn' : 'danger'}`;
    }
  }
};

const initDashboard = async () => {
  try {
    await checkActiveSession();
    await loadDashboardData();
  } catch (error) {
    showAlert('error', 'Initialization Error', 'Unable to sync dashboard telemetry.');
  }
};