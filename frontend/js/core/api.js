/**
 * LabourGuard - API Module
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

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
