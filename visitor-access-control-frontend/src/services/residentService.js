import api from './api';

export const residentService = {
  // Profile
  getProfile: async () => {
    const response = await api.get('/resident/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/resident/profile', data);
    return response.data;
  },

  toggleVisitors: async () => {
    const response = await api.put('/resident/toggle-visitors');
    return response.data;
  },

  // Trusted Contacts
  getTrustedContacts: async (page = 1, limit = 20) => {
    const response = await api.get('/resident/trusted-contacts', {
      params: { page, limit },
    });
    return response.data;
  },

  addTrustedContact: async (data) => {
    const response = await api.post('/resident/trusted-contacts', data);
    return response.data;
  },

  getTrustedContact: async (id) => {
    const response = await api.get(`/resident/trusted-contacts/${id}`);
    return response.data;
  },

  updateTrustedContact: async (id, data) => {
    const response = await api.put(`/resident/trusted-contacts/${id}`, data);
    return response.data;
  },

  deleteTrustedContact: async (id) => {
    const response = await api.delete(`/resident/trusted-contacts/${id}`);
    return response.data;
  },

  // Pre-registered Visitors
  getPreRegisteredVisitors: async (page = 1, limit = 20, status) => {
    const response = await api.get('/resident/visitors/pre-registered', {
      params: { page, limit, status },
    });
    return response.data;
  },

  preRegisterVisitor: async (data) => {
    const response = await api.post('/resident/visitors/pre-register', data);
    return response.data;
  },

  cancelPreRegisteredVisitor: async (id) => {
    const response = await api.delete(`/resident/visitors/pre-registered/${id}`);
    return response.data;
  },

  // Visitor Logs
  getVisitorLogs: async (page = 1, limit = 20) => {
    const response = await api.get('/resident/visitors/logs', {
      params: { page, limit },
    });
    return response.data;
  },
};