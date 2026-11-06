import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clubService } from '../services/clubService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';

export const ClubsPage = () => {
  const { isAuthenticated, isStudent, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClub, setSelectedClub] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await clubService.getAllClubs();
      if (res && res.data) {
        setClubs(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load clubs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleJoinClub = async (clubId, clubName) => {
    if (!isAuthenticated) {
      showToast('Please sign in to join clubs.', 'info');
      return;
    }
    try {
      setActionLoading(true);
      const res = await clubService.joinClub(clubId);
      showToast(res.message || `Joined ${clubName}!`, 'success');
      await fetchClubs();
      if (selectedClub && selectedClub.id === clubId) {
        openClubDetails(clubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join club.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClub = async (clubId, clubName) => {
    try {
      setActionLoading(true);
      const res = await clubService.leaveClub(clubId);
      showToast(res.message || `Left ${clubName}.`, 'info');
      await fetchClubs();
      if (selectedClub && selectedClub.id === clubId) {
        openClubDetails(clubId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave club.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openClubDetails = async (clubId) => {
    try {
      setModalLoading(true);
      const res = await clubService.getClubById(clubId);
      if (res && res.data) {
        setSelectedClub(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load club details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredClubs = clubs.filter(
    (c) =>
      c.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="clubs-page">
      <div className="page-header-banner">
        <div className="header-container">
          <div className="banner-badge">Student Organizations</div>
          <h1>Campus Clubs & Societies</h1>
          <p>
            Connect with student-led organizations, participate in community events, and grow your leadership skills.
          </p>

          <div className="banner-search-box">
            <input
              type="text"
              placeholder="Search clubs by name or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control banner-search-input"
            />
          </div>
        </div>
      </div>

      <div className="main-content-container">
        <div className="clubs-control-bar">
          <h2>
            Active Campus Clubs 
            <span className="results-count">({filteredClubs.length})</span>
          </h2>
          {isAdmin && (
            <Link to="/admin" className="btn btn-outline-primary btn-sm">
              + Manage Clubs in Admin Console
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading clubs directory...</p>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🏛️</div>
            <h3>No Clubs Found</h3>
            <p>Try searching for a different keyword or check back later.</p>
          </div>
        ) : (
          <div className="clubs-grid">
            {filteredClubs.map((club) => (
              <article key={club.id} className="club-card">
                <div className="club-card-header">
                  <div className="club-avatar">
                    {club.club_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="club-title-group">
                    <h3 className="club-name">{club.club_name}</h3>
                    <div className="club-coord-info">
                      Coordinator: <strong>{club.coordinator_name || 'Unassigned'}</strong>
                    </div>
                  </div>
                </div>

                <div className="club-card-body">
                  <p className="club-description">
                    {club.description
                      ? club.description.length > 130
                        ? `${club.description.substring(0, 130)}...`
                        : club.description
                      : 'No description provided.'}
                  </p>

                  <div className="club-stats-row">
                    <div className="club-stat-item">
                      <span className="stat-num">{club.member_count || 0}</span>
                      <span className="stat-label">Members</span>
                    </div>
                    <div className="club-stat-item">
                      <span className="stat-num">{club.event_count || 0}</span>
                      <span className="stat-label">Events Hosted</span>
                    </div>
                  </div>
                </div>

                <div className="club-card-footer">
                  <button
                    onClick={() => openClubDetails(club.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details
                  </button>

                  {isStudent && (
                    club.is_member ? (
                      <button
                        onClick={() => handleLeaveClub(club.id, club.club_name)}
                        disabled={actionLoading}
                        className="btn btn-outline-danger btn-sm"
                      >
                        Leave Club
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinClub(club.id, club.club_name)}
                        disabled={actionLoading}
                        className="btn btn-primary btn-sm"
                      >
                        Join Club
                      </button>
                    )
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Club Details & Events Modal */}
      <Modal
        isOpen={Boolean(selectedClub)}
        onClose={() => setSelectedClub(null)}
        title={selectedClub ? selectedClub.club_name : 'Club Details'}
        maxWidth="750px"
      >
        {modalLoading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading club profile...</p>
          </div>
        ) : selectedClub && (
          <div className="club-details-modal-content">
            <div className="club-modal-meta">
              <p className="modal-description">{selectedClub.description || 'No description provided.'}</p>
              <div className="meta-info-box">
                <div>
                  <strong>Staff/Faculty Coordinator:</strong>{' '}
                  {selectedClub.coordinator_name ? (
                    <span>{selectedClub.coordinator_name} ({selectedClub.coordinator_email})</span>
                  ) : (
                    <span className="text-muted">Not assigned</span>
                  )}
                </div>
                <div>
                  <strong>Active Student Members:</strong> {selectedClub.member_count || 0}
                </div>
              </div>
            </div>

            <div className="club-events-section">
              <h4>Club Events ({selectedClub.events?.length || 0})</h4>
              {selectedClub.events?.length === 0 ? (
                <p className="text-muted">This club has not posted any upcoming events yet.</p>
              ) : (
                <div className="club-event-mini-list">
                  {selectedClub.events.map((ev) => (
                    <div key={ev.id} className="mini-event-row">
                      <div className="mini-event-info">
                        <strong>
                          <Link to={`/events/${ev.id}`} onClick={() => setSelectedClub(null)}>
                            {ev.title}
                          </Link>
                        </strong>
                        <div className="mini-meta">
                          <span>📅 {ev.event_date}</span>
                          <span>📍 {ev.venue}</span>
                          <span>👥 {ev.registered_count} registered</span>
                        </div>
                      </div>
                      <Link
                        to={`/events/${ev.id}`}
                        onClick={() => setSelectedClub(null)}
                        className="btn btn-ghost btn-xs"
                      >
                        Details &rarr;
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
