import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import { clubService } from '../../services/clubService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const StudentDashboard = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations', 'clubs', 'profile'
  const [registrations, setRegistrations] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [cancellingEvent, setCancellingEvent] = useState(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Profile edit state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const [regsRes, clubsRes] = await Promise.all([
        registrationService.getMyRegistrations(),
        clubService.getAllClubs()
      ]);
      if (regsRes && regsRes.data) setRegistrations(regsRes.data);
      if (clubsRes && clubsRes.data) {
        setClubs(clubsRes.data.filter((c) => c.is_member));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async () => {
    if (!cancellingEvent) return;
    try {
      setCancellingLoading(true);
      const res = await registrationService.cancelRegistration(cancellingEvent.event_id);
      showToast(res.message || 'Registration cancelled.', 'info');
      setCancellingEvent(null);
      await fetchRegistrations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel.', 'error');
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleLeaveClub = async (clubId, clubName) => {
    try {
      await clubService.leaveClub(clubId);
      showToast(`Left ${clubName}.`, 'info');
      await fetchRegistrations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave club.', 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const payload = { name: nameInput.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      await updateProfile(payload);
      showToast('Profile updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
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

  const activeRegistrations = registrations.filter(
    (r) => r.registration_status === 'registered'
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-banner">
        <div className="dashboard-container">
          <div className="user-welcome">
            <span className="welcome-avatar">🎓</span>
            <div>
              <h1>Welcome, {user?.name}!</h1>
              <p>Campus Student Dashboard &bull; {user?.email}</p>
            </div>
          </div>

          <div className="dashboard-quick-stats">
            <div className="stat-pill">
              <span className="stat-label">Active Bookings</span>
              <strong>{activeRegistrations.length}</strong>
            </div>
            <div className="stat-pill">
              <span className="stat-label">Clubs Joined</span>
              <strong>{clubs.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Navigation Tabs */}
        <div className="dashboard-nav-tabs">
          <button
            className={`dash-tab ${activeTab === 'registrations' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('registrations')}
          >
            📋 My Event Registrations ({registrations.length})
          </button>
          <button
            className={`dash-tab ${activeTab === 'clubs' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            🏛️ My Clubs ({clubs.length})
          </button>
          <button
            className={`dash-tab ${activeTab === 'profile' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            ⚙️ Account Settings
          </button>
        </div>

        {/* Tab 1: My Registrations */}
        {activeTab === 'registrations' && (
          <div className="tab-pane">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your event registrations...</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🎟️</div>
                <h3>No Event Registrations Yet</h3>
                <p>You haven't registered for any events yet. Check out the latest campus events!</p>
                <Link to="/" className="btn btn-primary">
                  Browse Upcoming Events
                </Link>
              </div>
            ) : (
              <div className="registrations-list">
                {registrations.map((reg) => {
                  const isUpcoming =
                    new Date(reg.event_date) >= new Date(new Date().toDateString());

                  return (
                    <div key={reg.registration_id} className="registration-card">
                      <div className="reg-status-col">
                        <StatusBadge status={reg.registration_status} />
                        <span className="reg-category-pill">{reg.category_name}</span>
                      </div>

                      <div className="reg-info-col">
                        <div className="reg-club-name">
                          <span>●</span> {reg.club_name}
                        </div>
                        <h3 className="reg-event-title">
                          <Link to={`/events/${reg.event_id}`}>{reg.title}</Link>
                        </h3>

                        <div className="reg-meta-row">
                          <span>📅 {formatDate(reg.event_date)}</span>
                          <span>
                            ⏰ {formatTime(reg.start_time)} - {formatTime(reg.end_time)}
                          </span>
                          <span>📍 {reg.venue}</span>
                        </div>

                        <div className="reg-booked-on">
                          Registered on: {reg.registered_at ? reg.registered_at.substring(0, 16) : '—'}
                        </div>
                      </div>

                      <div className="reg-actions-col">
                        <Link to={`/events/${reg.event_id}`} className="btn btn-secondary btn-sm">
                          View Event
                        </Link>

                        {reg.registration_status === 'registered' && isUpcoming && (
                          <button
                            onClick={() => setCancellingEvent(reg)}
                            className="btn btn-outline-danger btn-sm"
                          >
                            Cancel Seat
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Clubs */}
        {activeTab === 'clubs' && (
          <div className="tab-pane">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading your clubs...</p>
              </div>
            ) : clubs.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">🏛️</div>
                <h3>You Haven't Joined Any Clubs</h3>
                <p>Joining clubs is a great way to stay involved in campus life.</p>
                <Link to="/clubs" className="btn btn-primary">
                  Explore Campus Clubs
                </Link>
              </div>
            ) : (
              <div className="clubs-grid">
                {clubs.map((c) => (
                  <div key={c.id} className="club-card">
                    <div className="club-card-header">
                      <div className="club-avatar">{c.club_name.charAt(0)}</div>
                      <div className="club-title-group">
                        <h3 className="club-name">{c.club_name}</h3>
                        <div className="club-coord-info">
                          Coordinator: <strong>{c.coordinator_name || 'Unassigned'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="club-card-body">
                      <p className="club-description">{c.description || 'No description provided.'}</p>
                    </div>

                    <div className="club-card-footer">
                      <Link to="/clubs" className="btn btn-secondary btn-sm">
                        View Club Details
                      </Link>
                      <button
                        onClick={() => handleLeaveClub(c.id, c.club_name)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        Leave Club
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Account Settings */}
        {activeTab === 'profile' && (
          <div className="tab-pane">
            <div className="profile-form-card">
              <h3>Update Your Profile & Password</h3>
              <p className="form-subtext">Manage your personal account details</p>

              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="student-name">Full Name</label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="student-email">Email Address</label>
                  <input
                    id="student-email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="form-control"
                  />
                  <small className="help-text">Campus email address cannot be changed.</small>
                </div>

                <div className="password-divider">
                  <h4>Change Password (Optional)</h4>
                </div>

                <div className="form-group">
                  <label htmlFor="current-pw">Current Password</label>
                  <input
                    id="current-pw"
                    type="password"
                    placeholder="Enter current password to verify"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-pw">New Password (min 6 characters)</label>
                  <input
                    id="new-pw"
                    type="password"
                    placeholder="Enter new secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-control"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary btn-md"
                >
                  {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Registration Confirmation Modal */}
      <Modal
        isOpen={Boolean(cancellingEvent)}
        onClose={() => setCancellingEvent(null)}
        title="Confirm Seat Cancellation"
        maxWidth="450px"
        footer={
          <div className="modal-actions-right">
            <button
              onClick={() => setCancellingEvent(null)}
              className="btn btn-secondary"
            >
              Keep Registration
            </button>
            <button
              onClick={handleCancelRegistration}
              disabled={cancellingLoading}
              className="btn btn-danger"
            >
              {cancellingLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        }
      >
        <p>
          Are you sure you want to cancel your seat for{' '}
          <strong>"{cancellingEvent?.title}"</strong>?
        </p>
      </Modal>
    </div>
  );
};
