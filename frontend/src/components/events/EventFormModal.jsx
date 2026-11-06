import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  clubs = [],
  categories = [],
  userRole = 'coordinator',
  managedClubId = null
}) => {
  const [formData, setFormData] = useState({
    club_id: managedClubId || '',
    category_id: '',
    title: '',
    description: '',
    venue: '',
    event_date: '',
    start_time: '10:00:00',
    end_time: '12:00:00',
    registration_deadline: '',
    max_participants: 50,
    status: 'published'
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      // Format deadline for datetime-local: "YYYY-MM-DDTHH:mm"
      let formattedDeadline = '';
      if (initialData.registration_deadline) {
        formattedDeadline = initialData.registration_deadline.replace(' ', 'T').substring(0, 16);
      }

      setFormData({
        club_id: initialData.club_id || managedClubId || '',
        category_id: initialData.category_id || '',
        title: initialData.title || '',
        description: initialData.description || '',
        venue: initialData.venue || '',
        event_date: initialData.event_date || '',
        start_time: initialData.start_time || '10:00:00',
        end_time: initialData.end_time || '12:00:00',
        registration_deadline: formattedDeadline,
        max_participants: initialData.max_participants || 50,
        status: initialData.status || 'published'
      });
    } else {
      setFormData({
        club_id: managedClubId || (clubs.length > 0 ? clubs[0].id : ''),
        category_id: categories.length > 0 ? categories[0].id : '',
        title: '',
        description: '',
        venue: '',
        event_date: '',
        start_time: '10:00:00',
        end_time: '12:00:00',
        registration_deadline: '',
        max_participants: 50,
        status: 'published'
      });
    }
    setErrorMsg('');
  }, [initialData, isOpen, managedClubId, clubs, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!formData.club_id) {
      return setErrorMsg('Please select a host club.');
    }
    if (!formData.category_id) {
      return setErrorMsg('Please select an event category.');
    }
    if (!formData.title.trim()) {
      return setErrorMsg('Event title is required.');
    }
    if (!formData.venue.trim()) {
      return setErrorMsg('Venue is required.');
    }
    if (!formData.event_date) {
      return setErrorMsg('Event date is required.');
    }
    if (formData.start_time >= formData.end_time) {
      return setErrorMsg('End time must be later than start time.');
    }
    if (!formData.registration_deadline) {
      return setErrorMsg('Registration deadline is required.');
    }
    if (parseInt(formData.max_participants, 10) <= 0) {
      return setErrorMsg('Maximum participants must be greater than zero.');
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        // Convert datetime-local "YYYY-MM-DDTHH:mm" to SQL "YYYY-MM-DD HH:mm:ss"
        registration_deadline: formData.registration_deadline.replace('T', ' ') + ':00',
        max_participants: parseInt(formData.max_participants, 10)
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Campus Event' : 'Create New Campus Event'}
      maxWidth="700px"
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {errorMsg && (
          <div className="alert-banner alert-danger full-width" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="form-group full-width">
          <label htmlFor="title">Event Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. Annual Hackathon 2026, Robotics Workshop"
            value={formData.title}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group half-width">
          <label htmlFor="club_id">Hosting Club *</label>
          <select
            id="club_id"
            name="club_id"
            required
            value={formData.club_id}
            onChange={handleChange}
            disabled={userRole === 'coordinator' && Boolean(managedClubId)}
            className="form-control"
          >
            <option value="">Select Club</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.club_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group half-width">
          <label htmlFor="category_id">Category *</label>
          <select
            id="category_id"
            name="category_id"
            required
            value={formData.category_id}
            onChange={handleChange}
            className="form-control"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            placeholder="Provide event overview, agenda, prerequisites..."
            value={formData.description}
            onChange={handleChange}
            className="form-control"
          ></textarea>
        </div>

        <div className="form-group full-width">
          <label htmlFor="venue">Venue / Location *</label>
          <input
            id="venue"
            name="venue"
            type="text"
            required
            placeholder="e.g. Main Auditorium, Seminar Hall 2, Lab 401"
            value={formData.venue}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group one-third">
          <label htmlFor="event_date">Event Date *</label>
          <input
            id="event_date"
            name="event_date"
            type="date"
            required
            value={formData.event_date}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group one-third">
          <label htmlFor="start_time">Start Time *</label>
          <input
            id="start_time"
            name="start_time"
            type="time"
            step="1"
            required
            value={formData.start_time}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group one-third">
          <label htmlFor="end_time">End Time *</label>
          <input
            id="end_time"
            name="end_time"
            type="time"
            step="1"
            required
            value={formData.end_time}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group half-width">
          <label htmlFor="registration_deadline">Registration Deadline *</label>
          <input
            id="registration_deadline"
            name="registration_deadline"
            type="datetime-local"
            required
            value={formData.registration_deadline}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group one-fourth">
          <label htmlFor="max_participants">Max Capacity *</label>
          <input
            id="max_participants"
            name="max_participants"
            type="number"
            min="1"
            required
            value={formData.max_participants}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="form-group one-fourth">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="form-control"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            {initialData && <option value="completed">Completed</option>}
            {initialData && <option value="cancelled">Cancelled</option>}
          </select>
        </div>

        <div className="form-actions full-width">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Saving...' : initialData ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
