import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to determine current role from URL
const getCurrentRole = () => {
  const path = window.location.pathname;
  if (path.startsWith('/resident')) return 'resident';
  if (path.startsWith('/security')) return 'security';
  if (path.startsWith('/admin')) return 'admin';
  
  // Fallback: check Zustand store
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.user?.role;
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    // Determine role from current route/context
    const role = getCurrentRole();
    let token = null;
    
    // Get role-specific token
    if (role) {
      token = localStorage.getItem(`${role}_accessToken`);
    }
    
    // Fallback: try to get from Zustand store
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.accessToken;
        } catch (e) {
          console.error('Error parsing auth storage:', e);
        }
      }
    }
    
    // Final fallback - check old key
    if (!token) {
      token = localStorage.getItem('accessToken');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const role = getCurrentRole();
      
      if (role) {
        // Clear only the current role's data
        localStorage.removeItem(`${role}_accessToken`);
        localStorage.removeItem(`${role}_refreshToken`);
        localStorage.removeItem(`${role}_user`);
        
        // Redirect to appropriate login
        if (role === 'security') {
          window.location.href = '/security/login';
        } else if (role === 'admin') {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      } else {
        // Clear all auth data
        const roles = ['resident', 'security', 'admin'];
        roles.forEach(r => {
          localStorage.removeItem(`${r}_accessToken`);
          localStorage.removeItem(`${r}_refreshToken`);
          localStorage.removeItem(`${r}_user`);
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;