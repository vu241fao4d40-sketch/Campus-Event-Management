import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge, StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { AttendeeRosterModal } from '../components/events/AttendeeRosterModal';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await eventService.getEventById(id);
      if (res && res.data) {
        setEvent(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load event details.', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }

    try {
      setActionLoading(true);
      const res = await registrationService.registerForEvent(id);
      showToast(res.message || 'Successfully registered!', 'success');
      await fetchEventDetails();
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setActionLoading(true);
      const res = await registrationService.cancelRegistration(id);
      showToast(res.message || 'Registration cancelled.', 'info');
      setCancelModalOpen(false);
      await fetchEventDetails();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel registration.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading event information...</p>
      </div>
    );
  }

  if (!event) return null;

  const isCoordinatorOfEvent = user && (isAdmin || user.id === event.coordinator_id || user.id === event.created_by);
  const isRegistered = event.user_registration_status === 'registered';
  const isFull = event.seats_remaining <= 0;
  const isDeadlinePassed = new Date(event.registration_deadline) < new Date();
  const percentFull = Math.min(
    100,
    Math.round(((event.registered_count || 0) / (event.max_participants || 1)) * 100)
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  };

  const formatDeadline = (deadlineStr) => {
    if (!deadlineStr) return '';
    const date = new Date(deadlineStr);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="event-details-page">
      <div className="details-container">
        {/* Breadcrumb / Back Link */}
        <div className="breadcrumb-nav">
          <Link to="/" className="back-link">
            &larr; Back to Events
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span>{event.title}</span>
        </div>

        <div className="event-layout-grid">
          {/* Main Details Column */}
          <div className="event-main-col">
            <div className="event-header-box">
              <div className="event-badges-row">
                <span className="event-category-pill">{event.category_name}</span>
                <StatusBadge status={event.status} />
              </div>

              <h1 className="event-page-title">{event.title}</h1>

              <div className="host-club-banner">
                <span className="host-label">Hosted by</span>
                <Link to={`/clubs`} className="host-club-link">
                  🏛️ {event.club_name}
                </Link>
              </div>
            </div>

            {/* Event Key Highlights */}
            <div className="event-key-info-grid">
              <div className="info-card">
                <div className="info-icon">📅</div>
                <div>
                  <div className="info-label">Event Date</div>
                  <div className="info-value">{formatDate(event.event_date)}</div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">⏰</div>
                <div>
                  <div className="info-label">Time & Duration</div>
                  <div className="info-value">
                    {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">📍</div>
                <div>
                  <div className="info-label">Campus Location</div>
                  <div className="info-value">{event.venue}</div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">👤</div>
                <div>
                  <div className="info-label">Event Organizer</div>
                  <div className="info-value">{event.creator_name}</div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="event-description-card">
              <h3>About this Event</h3>
              <div className="event-description-content">
                {event.description ? (
                  <p>{event.description}</p>
                ) : (
                  <p className="text-muted">No additional description has been provided for this event.</p>
                )}
              </div>
            </div>

            {/* Coordinator / Admin Controls */}
            {isCoordinatorOfEvent && (
              <div className="management-card">
                <h3>Event Management Controls</h3>
                <p>As a club coordinator or administrator, you can manage this event and its attendee roster.</p>
                <div className="mgmt-actions">
                  <button
                    onClick={() => setRosterModalOpen(true)}
                    className="btn btn-primary"
                  >
                    📋 View Attendee Roster ({event.registered_count || 0})
                  </button>
                  <Link to="/coordinator" className="btn btn-secondary">
                    ⚙️ Open Coordinator Hub
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Action Widget */}
          <aside className="event-sidebar-col">
            <div className="registration-action-card">
              <h3 className="sidebar-card-title">Event Registration</h3>

              {/* Capacity Status */}
              <div className="sidebar-capacity-section">
                <div className="capacity-meta">
                  <span>Available Seats</span>
                  <strong>{Math.max(0, event.seats_remaining)} / {event.max_participants}</strong>
                </div>
                <div className="progress-bar-bg large">
                  <div 
                    className={`progress-bar-fill ${percentFull >= 90 ? 'is-high' : percentFull >= 60 ? 'is-medium' : ''}`}
                    style={{ width: `${percentFull}%` }}
                  ></div>
                </div>
                <div className="capacity-caption">
                  {isFull ? (
                    <span className="text-danger">⚠️ All seats have been filled</span>
                  ) : (
                    <span>{event.seats_remaining} seats remaining</span>
                  )}
                </div>
              </div>

              {/* Deadline */}
              <div className="deadline-notice-box">
                <div className="deadline-label">Registration Deadline:</div>
                <div className="deadline-date">{formatDeadline(event.registration_deadline)}</div>
                {isDeadlinePassed && (
                  <div className="deadline-warning">⚠️ Registration period has concluded</div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons-group">
                {isRegistered ? (
                  <div className="registered-state-box">
                    <div className="registered-badge-pill">
                      ✓ You are registered for this event
                    </div>
                    <p className="registered-subtext">
                      We look forward to seeing you at {event.venue}!
                    </p>
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      disabled={actionLoading}
                      className="btn btn-outline-danger btn-block"
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : event.status !== 'published' ? (
                  <button disabled className="btn btn-disabled btn-block">
                    Event Not Published ({event.status.toUpperCase()})
                  </button>
                ) : isDeadlinePassed ? (
                  <button disabled className="btn btn-disabled btn-block">
                    Registration Closed
                  </button>
                ) : isFull ? (
                  <button disabled className="btn btn-disabled btn-block">
                    Event Fully Booked
                  </button>
                ) : !isAuthenticated ? (
                  <button
                    onClick={() => navigate('/login', { state: { from: { pathname: `/events/${id}` } } })}
                    className="btn btn-primary btn-block"
                  >
                    Sign In to Register
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={actionLoading}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    {actionLoading ? 'Processing...' : 'Register for Event'}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Cancel Registration Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Confirm Cancellation"
        maxWidth="450px"
        footer={
          <div className="modal-actions-right">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn btn-secondary"
            >
              Keep Registration
            </button>
            <button
              onClick={handleCancelRegistration}
              disabled={actionLoading}
              className="btn btn-danger"
            >
              {actionLoading ? 'Cancelling...' : 'Yes, Cancel Registration'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to cancel your registration for <strong>"{event.title}"</strong>? 
          Your seat will be released for other students.
        </p>
      </Modal>

      {/* Attendee Roster Modal for Coordinator / Admin */}
      {isCoordinatorOfEvent && (
        <AttendeeRosterModal
          isOpen={rosterModalOpen}
          onClose={() => setRosterModalOpen(false)}
          eventId={event.id}
          eventTitle={event.title}
        />
      )}
    </div>
  );
};
