import api from './api';

export const adminService = {
  async getAllUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data;
  },

  async updateUserRole(userId, role) {
    const res = await api.patch(`/users/${userId}/role`, { role });
    return res.data;
  },

  async getAdminStats() {
    const res = await api.get('/stats/overview');
    return res.data;
  },

  async getCoordinatorStats() {
    const res = await api.get('/stats/coordinator');
    return res.data;
  }
};
