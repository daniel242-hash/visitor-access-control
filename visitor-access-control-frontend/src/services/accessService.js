import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create a separate axios instance without auth interceptor for public access
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const accessService = {
  // Get access details (public - no auth required)
  getAccessDetails: async (token) => {
    const response = await publicApi.get(`/access/${token}`);
    return response.data;
  },

  // Refresh code (public - no auth required)
  refreshCode: async (token) => {
    const response = await publicApi.get(`/access/${token}/refresh`);
    return response.data;
  },
};