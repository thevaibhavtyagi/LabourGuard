/**
 * LabourGuard - Storage Module
 * Handles local storage operations with JSON support
 */

const PREFIX = 'labourguard_';

/**
 * Set item in localStorage with JSON serialization
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const set = (key, value) => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(PREFIX + key, serialized);
  } catch (error) {
    console.error('Storage set error:', error);
  }
};

/**
 * Get item from localStorage with JSON parsing
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Stored value or default
 */
export const get = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Storage get error:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const remove = (key) => {
  localStorage.removeItem(PREFIX + key);
};

/**
 * Clear all LabourGuard items from localStorage
 */
export const clear = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith(PREFIX))
    .forEach(key => localStorage.removeItem(key));
};

export default { set, get, remove, clear };
