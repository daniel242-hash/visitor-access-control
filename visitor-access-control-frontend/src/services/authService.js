import api from './api';

export const authService = {
  // Resident Registration
  registerResident: async (data) => {
    const response = await api.post('/auth/register/resident', data);
    return response.data;
  },

  // User Login (Resident/Admin)
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Security Login
  securityLogin: async (identifier, password) => {
    const response = await api.post('/auth/login/security', { identifier, password });
    return response.data;
  },

  // Get Current User
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset Password
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};