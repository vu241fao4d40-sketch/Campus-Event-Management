import api from './api';

export const clubService = {
  async getAllClubs() {
    const res = await api.get('/clubs');
    return res.data;
  },

  async getClubById(id) {
    const res = await api.get(`/clubs/${id}`);
    return res.data;
  },

  async createClub(clubData) {
    const res = await api.post('/clubs', clubData);
    return res.data;
  },

  async updateClub(id, clubData) {
    const res = await api.put(`/clubs/${id}`, clubData);
    return res.data;
  },

  async deleteClub(id) {
    const res = await api.delete(`/clubs/${id}`);
    return res.data;
  },

  async joinClub(id) {
    const res = await api.post(`/clubs/${id}/join`);
    return res.data;
  },

  async leaveClub(id) {
    const res = await api.post(`/clubs/${id}/leave`);
    return res.data;
  },

  async getClubMembers(id) {
    const res = await api.get(`/clubs/${id}/members`);
    return res.data;
  }
};
