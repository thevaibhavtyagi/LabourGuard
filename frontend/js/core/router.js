/**
 * LabourGuard - Router Module (Clean URL Master Edition)
 * Handles navigation and route protection without exposing .html
 */

import { isAuthenticated, hasRole } from './auth.js';

/**
 * Navigate to a URL
 * Automatically strips .html to ensure Clean URL consistency
 * @param {string} url - URL to navigate to
 */
export const navigate = (url) => {
  // Strip .html if it accidentally gets passed
  const cleanUrl = url.replace(/\.html$/, '');
  window.location.href = cleanUrl;
};

/**
 * Get current page name from URL
 * @returns {string} Current page name
 */
export const getCurrentPage = () => {
  const path = window.location.pathname;
  const page = path.split('/').pop().replace(/\.html$/, '');
  return page || 'index';
};

/**
 * Protected route guard
 * Redirects to login if not authenticated
 */
export const protectedRoute = (redirectTo = '/pages/login') => {
  if (!isAuthenticated()) {
    navigate(redirectTo);
    return false;
  }
  return true;
};

/**
 * Role-based route guard
 * Redirects if user doesn't have required role
 */
export const roleRoute = (requiredRole, redirectTo = '/pages/dashboard') => {
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
 */
export const guestRoute = (redirectTo = '/pages/dashboard') => {
  if (isAuthenticated()) {
    navigate(redirectTo);
    return false;
  }
  return true;
};

export default { navigate, getCurrentPage, protectedRoute, roleRoute, guestRoute };