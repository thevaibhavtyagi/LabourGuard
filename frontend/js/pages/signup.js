/**
 * LabourGuard - Signup Page
 * Handles signup form validation and submission
 */

import { redirectIfAuth, setAuth } from '../core/auth.js';
import { post } from '../core/api.js';

// Redirect if already authenticated
redirectIfAuth();

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
const alertContainer = document.getElementById('alert-container');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnLoader = document.getElementById('btn-loader');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Show field error
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorEl - Error element
 * @param {string} message - Error message
 */
const showError = (input, errorEl, message) => {
  input.classList.add('error');
  errorEl.textContent = message;
};

/**
 * Clear field error
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorEl - Error element
 */
const clearError = (input, errorEl) => {
  input.classList.remove('error');
  errorEl.textContent = '';
};

/**
 * Show alert message
 * @param {string} type - Alert type (success, error, warning, info)
 * @param {string} message - Alert message
 */
const showAlert = (type, message) => {
  alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${type === 'error' 
          ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
          : type === 'success'
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'
        }
      </svg>
      <span>${message}</span>
    </div>
  `;
};

/**
 * Clear alert
 */
const clearAlert = () => {
  alertContainer.innerHTML = '';
};

/**
 * Set loading state
 * @param {boolean} isLoading - Loading state
 */
const setLoading = (isLoading) => {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? 'Creating account...' : 'Create Account';
  btnLoader.classList.toggle('hidden', !isLoading);
};

/**
 * Validate form
 * @returns {boolean} Is valid
 */
const validateForm = () => {
  let isValid = true;
  
  // Validate name
  if (!nameInput.value.trim()) {
    showError(nameInput, nameError, 'Name is required');
    isValid = false;
  } else if (nameInput.value.trim().length < 2) {
    showError(nameInput, nameError, 'Name must be at least 2 characters');
    isValid = false;
  } else {
    clearError(nameInput, nameError);
  }
  
  // Validate email
  if (!emailInput.value.trim()) {
    showError(emailInput, emailError, 'Email is required');
    isValid = false;
  } else if (!validateEmail(emailInput.value)) {
    showError(emailInput, emailError, 'Please enter a valid email');
    isValid = false;
  } else {
    clearError(emailInput, emailError);
  }
  
  // Validate password
  if (!passwordInput.value) {
    showError(passwordInput, passwordError, 'Password is required');
    isValid = false;
  } else if (passwordInput.value.length < 8) {
    showError(passwordInput, passwordError, 'Password must be at least 8 characters');
    isValid = false;
  } else {
    clearError(passwordInput, passwordError);
  }
  
  // Validate confirm password
  if (!confirmPasswordInput.value) {
    showError(confirmPasswordInput, confirmPasswordError, 'Please confirm your password');
    isValid = false;
  } else if (confirmPasswordInput.value !== passwordInput.value) {
    showError(confirmPasswordInput, confirmPasswordError, 'Passwords do not match');
    isValid = false;
  } else {
    clearError(confirmPasswordInput, confirmPasswordError);
  }
  
  return isValid;
};

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
const handleSubmit = async (e) => {
  e.preventDefault();
  clearAlert();
  
  if (!validateForm()) return;
  
  setLoading(true);
  
  try {
    // Call signup API
    const response = await post('/auth/signup', {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: roleSelect.value
    });
    
    if (response.success) {
      // Store auth data
      setAuth(response.data.token, response.data.user);
      
      // Show success message
      showAlert('success', 'Account created successfully! Redirecting...');
      
      // Redirect based on role
      const user = response.data.user;
      setTimeout(() => {
        if (user.role === 'employer') {
          window.location.href = 'employer-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1500);
    }
    
  } catch (error) {
    showAlert('error', error.message || 'An error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Event Listeners
signupForm.addEventListener('submit', handleSubmit);

// Clear errors on input
nameInput.addEventListener('input', () => clearError(nameInput, nameError));
emailInput.addEventListener('input', () => clearError(emailInput, emailError));
passwordInput.addEventListener('input', () => clearError(passwordInput, passwordError));
confirmPasswordInput.addEventListener('input', () => clearError(confirmPasswordInput, confirmPasswordError));

console.log('LabourGuard Signup Page Loaded');
