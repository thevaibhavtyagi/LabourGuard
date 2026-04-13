/**
 * LabourGuard - Router Module
 * Handles navigation and route protection
 */

import { isAuthenticated, hasRole } from './auth.js';

/**
 * Navigate to a URL
 * @param {string} url - URL to navigate to
 */
export const navigate = (url) => {
  window.location.href = url;
};

/**
 * Get current page name from URL
 * @returns {string} Current page name
 */
export const getCurrentPage = () => {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace('.html', '');
  return page || 'index';
};

/**
 * Protected route guard
 * Redirects to login if not authenticated
 * @param {string} redirectTo - URL to redirect to if not authenticated
 * @returns {boolean} Whether access is granted
 */
export const protectedRoute = (redirectTo = '/pages/login.html') => {
  if (!isAuthenticated()) {
    navigate(redirectTo);
    return false;
  }
  return true;
};

/**
 * Role-based route guard
 * Redirects if user doesn't have required role
 * @param {string} requiredRole - Required role
 * @param {string} redirectTo - URL to redirect to if role doesn't match
 * @returns {boolean} Whether access is granted
 */
export const roleRoute = (requiredRole, redirectTo = '/pages/dashboard.html') => {
  if (!protectedRoute()) return false;
  
  if (!hasRole(requiredRole)) {
    navigate(redirectTo);
    return false;
  }
  return true;
};

/**
 * Guest route guard
 * Redirects if user is authenticated
 * @param {string} redirectTo - URL to redirect to if authenticated
 * @returns {boolean} Whether access is granted
 */
export const guestRoute = (redirectTo = '/pages/dashboard.html') => {
  if (isAuthenticated()) {
    navigate(redirectTo);
    return false;
  }
  return true;
};

export default { navigate, getCurrentPage, protectedRoute, roleRoute, guestRoute };
