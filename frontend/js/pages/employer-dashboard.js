/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Employer Dashboard Engine (Master Edition)
 * High-Fidelity Data Visualization, DOM Manipulation, and API Sync
 * ═══════════════════════════════════════════════════════════════
 */

import { requireAuth, getUser, clearAuth, hasRole } from '../core/auth.js';
import { get } from '../core/api.js';

// 1. Authorization Gate
if (!requireAuth('/pages/login.html')) {
  throw new Error('Authentication sequence failed');
}

if (hasRole('employee')) {
  window.location.href = 'dashboard.html';
  throw new Error('Rerouting to employee sector');
}

const user = getUser();

// 2. DOM Element Binding
const userNameEl = document.getElementById('user-name');
const userRoleEl = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const periodSelect = document.getElementById('period-select');
const refreshBtn = document.getElementById('refresh-btn');

// Stats Binding
const statEmployees = document.getElementById('stat-employees');
const statActive = document.getElementById('stat-active');
const statHours = document.getElementById('stat-hours');
const statAvgHours = document.getElementById('stat-avg-hours');
const statSessions = document.getElementById('stat-sessions');
const statCheckedIn = document.getElementById('stat-checked-in');
const statViolations = document.getElementById('stat-violations');

// Grid & Feed Binding
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-tab');
const employeesTableBody = document.getElementById('employees-table-body');
const violationsList = document.getElementById('violations-list');

// UI Elements
const toastContainer = document.getElementById('toast-container');
const employeeModal = document.getElementById('employee-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// Global State
let employees = [];
let currentFilter = 'all';
let searchTerm = '';
let hoursChartInstance = null;

// 3. Initialization
document.addEventListener('DOMContentLoaded', () => {
  if (user) {
    userNameEl.textContent = user.name;
    userRoleEl.textContent = user.role;
  }
  
  bindEvents();
  loadDashboardData();
  triggerEntryAnimations();
});

// Staggered CSS Animation Trigger
function triggerEntryAnimations() {
  const elements = document.querySelectorAll('.stagger-enter');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('show');
    }, index * 50); // Fast 50ms stagger
  });
}

// Event Bindings
function bindEvents() {
  logoutBtn.addEventListener('click', () => {
    clearAuth();
    window.location.href = 'login.html';
  });

  periodSelect.addEventListener('change', loadDashboardData);
  refreshBtn.addEventListener('click', () => {
    const icon = refreshBtn.querySelector('svg');
    icon.style.animation = 'spin 1s linear infinite';
    loadDashboardData().finally(() => {
      setTimeout(() => { icon.style.animation = ''; }, 500);
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderEmployeesTable();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderEmployeesTable();
    });
  });

  modalClose.addEventListener('click', () => employeeModal.classList.remove('show'));
  employeeModal.addEventListener('click', (e) => {
    if (e.target === employeeModal) employeeModal.classList.remove('show');
  });
}

// 4. UI Helper Functions
const showToast = (type, title, message) => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'error' 
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    
  toast.innerHTML = `
    ${icon}
    <div>
      <div style="font-weight: 600; font-size: 0.9rem;">${title}</div>
      <div style="font-size: 0.8rem; color: var(--color-gray-300);">${message}</div>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation frame for CSS transition
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400); // Wait for transition out
  }, 4000);
};

const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const formatHours = (hours) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// 5. Core Data Synchronization
const loadDashboardData = async () => {
  try {
    await Promise.all([
      loadAnalytics(),
      loadEmployees(),
      loadViolations()
    ]);
  } catch (error) {
    console.error('Sync Error:', error);
    showToast('error', 'Sync Failure', 'Unable to retrieve latest telemetry.');
  }
};

const loadAnalytics = async () => {
  try {
    const period = periodSelect.value;
    const response = await get(`/employer/analytics?period=${period}`);
    
    if (response.success) {
      const data = response.data;
      
      statEmployees.textContent = data.summary.totalEmployees;
      statActive.innerHTML = `<span class="status-dot" style="background:var(--color-success); box-shadow:0 0 6px var(--color-success); animation:pulse 2s infinite; margin-right:4px;"></span> ${data.summary.activeEmployees} active profiles`;
      statHours.textContent = `${data.summary.totalHours}h`;
      statAvgHours.textContent = `${data.summary.averageHoursPerEmployee}h avg / employee`;
      statSessions.textContent = data.summary.totalSessions;
      statCheckedIn.textContent = `${data.summary.checkedInNow} active sessions`;
      statViolations.textContent = data.summary.violations;
      
      renderHighFidelityChart(data.dailyData);
    }
  } catch (error) {
    console.error(error);
  }
};

const loadEmployees = async () => {
  try {
    const response = await get('/employer/employees');
    if (response.success) {
      employees = response.data;
      renderEmployeesTable();
    }
  } catch (error) {
    console.error(error);
  }
};

const loadViolations = async () => {
  try {
    const response = await get('/employer/violations?limit=10');
    
    if (response.success && response.data.length > 0) {
      renderViolationsFeed(response.data);
    } else {
      violationsList.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--color-gray-400);">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem; opacity: 0.5;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p style="margin:0; font-size:0.9rem;">Zero flags recorded. All operations compliant.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error(error);
  }
};

// 6. Rendering Engines
const renderEmployeesTable = () => {
  let filtered = [...employees];
  
  if (searchTerm) {
    filtered = filtered.filter(e => 
      e.name.toLowerCase().includes(searchTerm) || e.email.toLowerCase().includes(searchTerm)
    );
  }
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(e => e.status === currentFilter);
  }
  
  if (filtered.length === 0) {
    employeesTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 4rem; color: var(--color-gray-400);">
          <p>No identities match the current query parameters.</p>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  filtered.forEach(emp => {
    const initials = getInitials(emp.name);
    const th = parseFloat(emp.todayHours);
    const wh = parseFloat(emp.weekHours);
    const isOT = wh > 48;
    
    let statusPill = '';
    if(emp.isCheckedIn) {
      statusPill = `<span class="status-pill active"><span class="status-dot"></span> Active</span>`;
    } else {
      statusPill = `<span class="status-pill ${emp.status}"><span class="status-dot"></span> ${emp.status}</span>`;
    }
    
    html += `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar-circle">${initials}</div>
            <div class="user-cell-info">
              <h4>${emp.name}</h4>
              <p>${emp.email}</p>
            </div>
          </div>
        </td>
        <td>${statusPill}</td>
        <td class="num-cell">${formatHours(th)}</td>
        <td class="num-cell ${isOT ? 'alert' : ''}">${formatHours(wh)}</td>
        <td class="num-cell">${emp.violationCount > 0 ? `<span style="color:var(--color-error); font-weight:700;">${emp.violationCount}</span>` : '-'}</td>
        <td>
          <button class="action-button" onclick="viewEmployeeDetails('${emp.id}')">Audit Logs</button>
        </td>
      </tr>
    `;
  });
  
  employeesTableBody.innerHTML = html;
};

const renderViolationsFeed = (violations) => {
  let html = '';
  violations.forEach(v => {
    const timeAgo = getTimeAgo(new Date(v.date));
    const isCritical = v.severity === 'critical';
    
    const svgIcon = isCritical
      ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
      : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      
    html += `
      <div class="feed-item">
        <div class="feed-icon ${isCritical ? 'critical' : 'warning'}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${svgIcon}</svg>
        </div>
        <div class="feed-content">
          <h4>${v.employee.name}</h4>
          <p>${v.description}</p>
          <div class="feed-time">${timeAgo}</div>
        </div>
      </div>
    `;
  });
  violationsList.innerHTML = html;
};

// Advanced Chart.js Integration
const renderHighFidelityChart = (dailyData) => {
  const ctx = document.getElementById('hoursChartCanvas').getContext('2d');
  
  if (hoursChartInstance) {
    hoursChartInstance.destroy();
  }

  const last7Days = dailyData.slice(-7);
  const labels = last7Days.map(d => new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }));
  const dataPoints = last7Days.map(d => parseFloat(d.hours));

  // Create Premium Gradient Fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)'); // accent color
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  // Define colors based on thresholds
  const barColors = dataPoints.map(val => {
    if(val > 48) return '#ef4444'; // Error
    if(val > 40) return '#f59e0b'; // Warning
    return '#4f46e5'; // Primary Accent
  });

  hoursChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Aggregated Hours',
        data: dataPoints,
        backgroundColor: barColors,
        borderRadius: 6,
        borderWidth: 0,
        barPercentage: 0.6
      },
      {
        type: 'line',
        label: 'Trend',
        data: dataPoints,
        borderColor: '#3730A3',
        backgroundColor: gradient,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#000000',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 }, color: '#94a3b8' } },
        y: { 
          grid: { color: '#f1f5f9', borderDash: [5, 5] }, 
          ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#94a3b8', padding: 10 },
          border: { display: false }
        }
      }
    }
  });
};

// 7. Master Modal Controller
window.viewEmployeeDetails = async (employeeId) => {
  try {
    const response = await get(`/employer/employees/${employeeId}/logs?limit=10`);
    
    if (response.success) {
      const { employee, logs } = response.data;
      const initials = getInitials(employee.name);
      
      let totalMinutes = 0;
      logs.forEach(log => { if (log.totalMinutes) totalMinutes += log.totalMinutes; });
      
      const totalHours = (totalMinutes / 60).toFixed(1);
      const avgSession = logs.length > 0 ? (totalMinutes / logs.length / 60).toFixed(1) : '0';
      
      let logsHtml = '';
      logs.forEach(log => {
        const dateStr = new Date(log.checkIn).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const hours = log.totalMinutes ? (log.totalMinutes / 60).toFixed(1) : '-';
        logsHtml += `
          <div style="display:flex; justify-content:space-between; padding:0.8rem 0; border-bottom:1px solid var(--color-gray-100);">
            <span style="color:var(--color-gray-500); font-size:0.9rem;">${dateStr}</span>
            <span style="font-family:'JetBrains Mono', monospace; font-weight:600; color:var(--color-primary);">${hours}h</span>
          </div>
        `;
      });
      
      if (logs.length === 0) logsHtml = '<p style="text-align:center; padding:2rem; color:var(--color-gray-400);">No telemetry recorded for this identity.</p>';
      
      modalBody.innerHTML = `
        <div class="modal-profile">
          <div class="modal-avatar">${initials}</div>
          <div>
            <h3 style="margin:0 0 4px 0; font-size:1.4rem; color:var(--color-primary);">${employee.name}</h3>
            <p style="margin:0; color:var(--color-gray-500); font-size:0.9rem;">${employee.email}</p>
          </div>
        </div>
        
        <div class="modal-grid">
          <div class="modal-stat-box">
            <div class="modal-stat-label">Cycle Hours</div>
            <div class="modal-stat-val">${totalHours}h</div>
          </div>
          <div class="modal-stat-box">
            <div class="modal-stat-label">Session Avg</div>
            <div class="modal-stat-val">${avgSession}h</div>
          </div>
        </div>
        
        <h4 style="font-size:1rem; margin-bottom:1rem; color:var(--color-primary);">Immutable Audit Log</h4>
        <div style="background:var(--color-bg-base); padding:0 var(--space-4); border-radius:var(--radius-lg); border:1px solid var(--color-gray-200);">
          ${logsHtml}
        </div>
      `;
      
      employeeModal.classList.add('show');
    }
  } catch (error) {
    showToast('error', 'Audit Failed', 'Could not retrieve identity telemetry.');
  }
};