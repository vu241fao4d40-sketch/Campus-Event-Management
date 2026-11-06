import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { clubService } from '../../services/clubService';
import { categoryService } from '../../services/categoryService';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badge';
import { EventFormModal } from '../../components/events/EventFormModal';
import { AttendeeRosterModal } from '../../components/events/AttendeeRosterModal';

export const CoordinatorDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [rosterModalEvent, setRosterModalEvent] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, clubsRes, catsRes] = await Promise.all([
        adminService.getCoordinatorStats(),
        clubService.getAllClubs(),
        categoryService.getAllCategories()
      ]);

      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
      if (clubsRes && clubsRes.data) {
        setClubs(clubsRes.data);
      }
      if (catsRes && catsRes.data) {
        setCategories(catsRes.data);
      }

      // Fetch events
      const clubId = statsRes?.data?.club?.id;
      const eventParams = { timeframe: 'all' };
      if (clubId) {
        eventParams.club_id = clubId;
      }
      const eventsRes = await eventService.getAllEvents(eventParams);
      if (eventsRes && eventsRes.data) {
        setEvents(eventsRes.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load coordinator data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCreateOrUpdateEvent = async (eventData) => {
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.id, eventData);
        showToast('Event updated successfully!', 'success');
      } else {
        await eventService.createEvent(eventData);
        showToast('Event created successfully!', 'success');
      }
      setEditingEvent(null);
      await loadDashboardData();
    } catch (err) {
      throw err;
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await eventService.updateEventStatus(eventId, newStatus);
      showToast(`Event status updated to ${newStatus}!`, 'success');
      await loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const filteredEvents = events.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  return (
    <div className="dashboard-page coordinator-portal">
      {/* Banner */}
      <div className="dashboard-header-banner">
        <div className="dashboard-container">
          <div className="user-welcome">
            <span className="welcome-avatar">🏛️</span>
            <div>
              <h1>Club Coordinator Portal</h1>
              <p>
                {stats?.has_club
                  ? `Assigned Club: ${stats.club.club_name}`
                  : isAdmin
                  ? 'Administrator Access — Managing All Campus Events'
                  : 'No club currently assigned to your coordinator profile'}
              </p>
            </div>
          </div>

          <div className="dashboard-banner-actions">
            <button
              onClick={() => {
                setEditingEvent(null);
                setFormModalOpen(true);
              }}
              className="btn btn-primary"
            >
              + Create New Event
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Metric Cards */}
        {stats && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-body">
                <span className="metric-title">Club Members</span>
                <strong className="metric-value">{stats.members || 0}</strong>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📅</div>
              <div className="metric-body">
                <span className="metric-title">Total Events</span>
                <strong className="metric-value">{stats.events?.total_events || events.length}</strong>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎟️</div>
              <div className="metric-body">
                <span className="metric-title">Active Registrations</span>
                <strong className="metric-value text-primary">
                  {stats.registrations?.active_registrations || 0}
                </strong>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">✓</div>
              <div className="metric-body">
                <span className="metric-title">Attended Registrations</span>
                <strong className="metric-value text-success">
                  {stats.registrations?.attended_registrations || 0}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Event Management Table */}
        <div className="content-card">
          <div className="card-header-bar">
            <div>
              <h3>Organized Events</h3>
              <p className="card-subtext">Manage schedules, publication statuses, and attendance check-in</p>
            </div>

            <div className="table-filters">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-filter"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state-box">
              <p>No events found for this selection.</p>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setFormModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title & Club</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                    <th>Registered / Capacity</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <strong>
                          <Link to={`/events/${ev.id}`}>{ev.title}</Link>
                        </strong>
                        <div className="sub-text text-muted">{ev.club_name} &bull; {ev.category_name}</div>
                      </td>
                      <td>
                        <div>📅 {ev.event_date}</div>
                        <div className="sub-text text-muted">
                          ⏰ {ev.start_time?.substring(0, 5)} - {ev.end_time?.substring(0, 5)}
                        </div>
                      </td>
                      <td>{ev.venue}</td>
                      <td>
                        <strong>{ev.registered_count || 0}</strong> / {ev.max_participants}
                        <div className="progress-bar-bg mini">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(((ev.registered_count || 0) / ev.max_participants) * 100)
                              )}%`
                            }}
                          ></div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={ev.status} />
                      </td>
                      <td>
                        <div className="table-action-btns">
                          <button
                            onClick={() => setRosterModalEvent(ev)}
                            className="btn btn-outline-primary btn-xs"
                            title="View Attendee Roster"
                          >
                            📋 Roster ({ev.registered_count || 0})
                          </button>

                          <button
                            onClick={() => {
                              setEditingEvent(ev);
                              setFormModalOpen(true);
                            }}
                            className="btn btn-outline-secondary btn-xs"
                            title="Edit Event Details"
                          >
                            ✏️ Edit
                          </button>

                          {/* Quick status dropdown */}
                          <select
                            value={ev.status}
                            onChange={(e) => handleStatusChange(ev.id, e.target.value)}
                            className="status-quick-select"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Publish</option>
                            <option value="completed">Complete</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Event Modal */}
      <EventFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleCreateOrUpdateEvent}
        initialData={editingEvent}
        clubs={clubs}
        categories={categories}
        userRole={user?.role}
        managedClubId={stats?.club?.id || user?.managedClub?.id}
      />

      {/* Attendee Roster & Check-In Modal */}
      {rosterModalEvent && (
        <AttendeeRosterModal
          isOpen={Boolean(rosterModalEvent)}
          onClose={() => setRosterModalEvent(null)}
          eventId={rosterModalEvent.id}
          eventTitle={rosterModalEvent.title}
        />
      )}
    </div>
  );
};
