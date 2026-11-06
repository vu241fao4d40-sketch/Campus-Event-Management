import api from './api';

export const registrationService = {
  async registerForEvent(eventId) {
    const res = await api.post(`/events/${eventId}/register`);
    return res.data;
  },

  async cancelRegistration(eventId) {
    const res = await api.post(`/events/${eventId}/cancel`);
    return res.data;
  },

  async getMyRegistrations() {
    const res = await api.get('/registrations/my');
    return res.data;
  },

  async getEventAttendees(eventId) {
    const res = await api.get(`/events/${eventId}/attendees`);
    return res.data;
  },

  async updateAttendance(registrationId, status) {
    const res = await api.patch(`/registrations/${registrationId}/attendance`, { status });
    return res.data;
  }
};
