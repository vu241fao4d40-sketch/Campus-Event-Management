import api from './api';

export const eventService = {
  async getAllEvents(params = {}) {
    const res = await api.get('/events', { params });
    return res.data;
  },

  async getEventById(id) {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },

  async createEvent(eventData) {
    const res = await api.post('/events', eventData);
    return res.data;
  },

  async updateEvent(id, eventData) {
    const res = await api.put(`/events/${id}`, eventData);
    return res.data;
  },

  async updateEventStatus(id, status) {
    const res = await api.patch(`/events/${id}/status`, { status });
    return res.data;
  },

  async deleteEvent(id) {
    const res = await api.delete(`/events/${id}`);
    return res.data;
  }
};
