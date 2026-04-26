/**
 * LabourGuard - Auth Module
 * Handles authentication state and operations
 */

const TOKEN_KEY = 'labourguard_token';
const USER_KEY = 'labourguard_user';

/**
 * Store authentication data
 * @param {string} token - JWT token
 * @param {object} user - User data
 */
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get stored token
 * @returns {string|null} JWT token
 */
export const getToken = () => localStorage.getItem(TOKEN_KEY);

/**
 * Get stored user data
 * @returns {object|null} User data
 */
export const getUser = () => {
  const userData = localStorage.getItem(USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} Role status
 */
export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};

/**
 * Clear authentication data (logout)
 */
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Redirect to login if not authenticated
 * @param {string} redirectTo - URL to redirect to after login
 */
export const requireAuth = (redirectTo = '/pages/login') => {
  if (!isAuthenticated()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
};

/**
 * Redirect if already authenticated
 * Redirects to appropriate dashboard based on user role
 */
export const redirectIfAuth = () => {
  if (isAuthenticated()) {
    const user = getUser();
    if (user?.role === 'employer') {
      window.location.href = 'employer-dashboard';
    } else {
      window.location.href = 'dashboard';
    }
    return true;
  }
  return false;
};

export default {
  setAuth,
  getToken,
  getUser,
  isAuthenticated,
  hasRole,
  clearAuth,
  requireAuth,
  redirectIfAuth
};
