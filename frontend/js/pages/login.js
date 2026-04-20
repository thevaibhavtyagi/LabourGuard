/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Login Page Engineering (Master Edition)
 * Handles form validation, UI states, and Authentication API
 * ═══════════════════════════════════════════════════════════════
 */

import { redirectIfAuth, setAuth, getUser } from '../core/auth.js';
import { post } from '../core/api.js';

// Redirect if already authenticated
redirectIfAuth();

document.addEventListener('DOMContentLoaded', () => {
  console.log('LabourGuard Auth Engine: Online');
  initEntryAnimations();
  initFormInteractions();
});

/**
 * Trigger High-Fidelity Entry Animations
 */
function initEntryAnimations() {
  const brandPanel = document.getElementById('anim-brand');
  const formPanel = document.getElementById('anim-form');
  
  // Slight stagger for a premium feel
  setTimeout(() => {
    if (brandPanel) brandPanel.classList.add('anim-active');
  }, 100);
  
  setTimeout(() => {
    if (formPanel) formPanel.classList.add('anim-active');
  }, 250);
}

/**
 * Form Initialization & Event Binding
 */
function initFormInteractions() {
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  
  const alertContainer = document.getElementById('alert-container');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');

  // Regex validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Error UI Handlers
  const showError = (input, errorEl, message) => {
    input.classList.add('error');
    errorEl.textContent = message;
    // Add a tiny shake animation for error feedback
    input.parentElement.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
    setTimeout(() => { input.parentElement.style.animation = ''; }, 400);
  };

  const clearError = (input, errorEl) => {
    input.classList.remove('error');
    if(errorEl) errorEl.textContent = '';
  };

  const showAlert = (type, message) => {
    alertContainer.innerHTML = `
      <div class="alert alert-${type}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${type === 'error' 
            ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          }
        </svg>
        <span>${message}</span>
      </div>
    `;
  };

  const clearAlert = () => { alertContainer.innerHTML = ''; };

  // Button Loading State
  const setLoading = (isLoading) => {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = 'Authenticating...';
      btnLoader.style.display = 'inline-block';
      submitBtn.style.opacity = '0.8';
    } else {
      btnText.textContent = 'Access Dashboard';
      btnLoader.style.display = 'none';
      submitBtn.style.opacity = '1';
    }
  };

  // Master Validation Function
  const validateForm = () => {
    let isValid = true;
    
    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'Email address is required.');
      isValid = false;
    } else if (!validateEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Please enter a valid format.');
      isValid = false;
    } else {
      clearError(emailInput, emailError);
    }
    
    if (!passwordInput.value) {
      showError(passwordInput, passwordError, 'Security protocol requires a password.');
      isValid = false;
    } else if (passwordInput.value.length < 8) {
      showError(passwordInput, passwordError, 'Requires minimum 8 characters.');
      isValid = false;
    } else {
      clearError(passwordInput, passwordError);
    }
    
    return isValid;
  };

  // API Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAlert();
    
    if (!validateForm()) return;
    setLoading(true);
    
    try {
      // Execute original API logic exactly as requested
      const response = await post('/auth/login', {
        email: emailInput.value.trim(),
        password: passwordInput.value
      });
      
      if (response.success) {
        setAuth(response.data.token, response.data.user);
        showAlert('success', 'Authentication verified. Routing to dashboard...');
        
        // Dynamic redirection based on role
        const user = response.data.user;
        setTimeout(() => {
          if (user.role === 'employer') {
            window.location.href = 'employer-dashboard.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 1000);
      }
      
    } catch (error) {
      showAlert('error', error.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Event Listeners for Real-time clearing
  loginForm.addEventListener('submit', handleSubmit);
  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));

  // Add the CSS shake animation dynamically
  if (!document.getElementById('shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.innerHTML = `
      @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
      }
    `;
    document.head.appendChild(style);
  }
}