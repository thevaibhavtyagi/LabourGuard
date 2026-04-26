/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Signup Page Engineering (Master Edition)
 * Handles form validation, UI states, and Authentication API
 * ═══════════════════════════════════════════════════════════════
 */

import { redirectIfAuth, setAuth } from '../core/auth.js';
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
  const signupForm = document.getElementById('signup-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const roleSelect = document.getElementById('role');
  
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const confirmPasswordError = document.getElementById('confirm-password-error');
  const roleError = document.getElementById('role-error');
  
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
      btnText.textContent = 'Securing Identity...';
      btnLoader.style.display = 'inline-block';
      submitBtn.style.opacity = '0.8';
    } else {
      btnText.textContent = 'Create Organization Identity';
      btnLoader.style.display = 'none';
      submitBtn.style.opacity = '1';
    }
  };

  // Master Validation Function
  const validateForm = () => {
    let isValid = true;
    
    if (!nameInput.value.trim()) {
      showError(nameInput, nameError, 'Identity name is required.');
      isValid = false;
    } else if (nameInput.value.trim().length < 2) {
      showError(nameInput, nameError, 'Name must be at least 2 characters.');
      isValid = false;
    } else {
      clearError(nameInput, nameError);
    }
    
    if (!roleSelect.value) {
      showError(roleSelect, roleError, 'Please select an account type.');
      isValid = false;
    } else {
      clearError(roleSelect, roleError);
    }
    
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
    
    if (!confirmPasswordInput.value) {
      showError(confirmPasswordInput, confirmPasswordError, 'Please confirm security key.');
      isValid = false;
    } else if (confirmPasswordInput.value !== passwordInput.value) {
      showError(confirmPasswordInput, confirmPasswordError, 'Security keys do not match.');
      isValid = false;
    } else {
      clearError(confirmPasswordInput, confirmPasswordError);
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
      const response = await post('/auth/signup', {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: roleSelect.value
      });
      
      if (response.success) {
        setAuth(response.data.token, response.data.user);
        showAlert('success', 'Identity secured successfully. Routing...');
        
        // Dynamic redirection based on role
        const user = response.data.user;
        setTimeout(() => {
          if (user.role === 'employer') {
            window.location.href = 'employer-dashboard';
          } else {
            window.location.href = 'dashboard';
          }
        }, 1500);
      }
      
    } catch (error) {
      showAlert('error', error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Event Listeners for Real-time clearing
  signupForm.addEventListener('submit', handleSubmit);
  nameInput.addEventListener('input', () => clearError(nameInput, nameError));
  emailInput.addEventListener('input', () => clearError(emailInput, emailError));
  passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));
  confirmPasswordInput.addEventListener('input', () => clearError(confirmPasswordInput, confirmPasswordError));
  roleSelect.addEventListener('change', () => clearError(roleSelect, roleError));

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