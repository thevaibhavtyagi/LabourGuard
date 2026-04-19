/**
 * LabourGuard - API Module
 * Handles all HTTP requests to the backend
 */

// Dynamically determine the backend URL based on the current environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If testing locally, use port 5000. If deployed on Vercel, use the Render backend!
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:5000/api' 
  : 'https://labourguard-backend.onrender.com/api';

console.log(`🔌 LabourGuard API connected to: ${isLocalhost ? 'Local Development' : 'Production Cloud'}`);

/**
 * Makes an HTTP request to the API
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
export const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('labourguard_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * GET request
 */
export const get = (endpoint) => request(endpoint, { method: 'GET' });

/**
 * POST request
 */
export const post = (endpoint, body) => 
  request(endpoint, { method: 'POST', body: JSON.stringify(body) });

/**
 * PUT request
 */
export const put = (endpoint, body) => 
  request(endpoint, { method: 'PUT', body: JSON.stringify(body) });

/**
 * DELETE request
 */
export const del = (endpoint) => request(endpoint, { method: 'DELETE' });

export default { request, get, post, put, del };