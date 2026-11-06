import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { clubService } from '../../services/clubService';
import { categoryService } from '../../services/categoryService';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'clubs', 'categories', 'users', 'events'
  const [stats, setStats] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // User search/filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Modals state
  const [clubModalOpen, setClubModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [clubForm, setClubForm] = useState({ club_name: '', description: '', coordinator_id: '' });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ category_name: '', description: '' });

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, clubsRes, catsRes, usersRes, eventsRes] = await Promise.all([
        adminService.getAdminStats(),
        clubService.getAllClubs(),
        categoryService.getAllCategories(),
        adminService.getAllUsers(),
        eventService.getAllEvents({ timeframe: 'all' })
      ]);

      if (statsRes && statsRes.data) setStats(statsRes.data);
      if (clubsRes && clubsRes.data) setClubs(clubsRes.data);
      if (catsRes && catsRes.data) setCategories(catsRes.data);
      if (usersRes && usersRes.data) setUsers(usersRes.data);
      if (eventsRes && eventsRes.data) setEvents(eventsRes.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load administrative data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Club Handlers
  const handleSaveClub = async (e) => {
    e.preventDefault();
    try {
      if (editingClub) {
        await clubService.updateClub(editingClub.id, clubForm);
        showToast('Club updated successfully!', 'success');
      } else {
        await clubService.createClub(clubForm);
        showToast('Club created successfully!', 'success');
      }
      setClubModalOpen(false);
      setEditingClub(null);
      setClubForm({ club_name: '', description: '', coordinator_id: '' });
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save club.', 'error');
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;
    try {
      await clubService.deleteClub(clubId);
      showToast('Club deleted successfully.', 'info');
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete club.', 'error');
    }
  };

  // Category Handlers
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, catForm);
        showToast('Category updated successfully!', 'success');
      } else {
        await categoryService.createCategory(catForm);
        showToast('Category created successfully!', 'success');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCatForm({ category_name: '', description: '' });
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category.', 'error');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoryService.deleteCategory(catId);
      showToast('Category deleted successfully.', 'info');
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category.', 'error');
    }
  };

  // Role Handler
  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      showToast(`User role updated to ${newRole}!`, 'success');
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(eventId);
      showToast('Event deleted successfully.', 'info');
      await loadAllAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete event.', 'error');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter ? u.role === userRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  const coordinatorUsers = users.filter((u) => u.role === 'coordinator' || u.role === 'admin');

  return (
    <div className="dashboard-page admin-console">
      {/* Banner */}
      <div className="dashboard-header-banner admin-banner">
        <div className="dashboard-container">
          <div className="user-welcome">
            <span className="welcome-avatar">🛡️</span>
            <div>
              <h1>Campus Administrator Console</h1>
              <p>Platform Governance &bull; Club Management &bull; User Roles &bull; Analytics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Metric Tiles */}
        {stats && (
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-body">
                <span className="metric-title">Total Users</span>
                <strong className="metric-value">{stats.users?.total_users || 0}</strong>
                <small className="metric-sub">{stats.users?.total_students || 0} Students &bull; {stats.users?.total_coordinators || 0} Coordinators</small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🏛️</div>
              <div className="metric-body">
                <span className="metric-title">Active Clubs</span>
                <strong className="metric-value">{stats.clubs?.total_clubs || clubs.length}</strong>
                <small className="metric-sub">{categories.length} Event Categories</small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">📅</div>
              <div className="metric-body">
                <span className="metric-title">Total Events</span>
                <strong className="metric-value text-primary">{stats.events?.total_events || 0}</strong>
                <small className="metric-sub">{stats.events?.published_events || 0} Published &bull; {stats.events?.draft_events || 0} Drafts</small>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">🎟️</div>
              <div className="metric-body">
                <span className="metric-title">Registrations</span>
                <strong className="metric-value text-success">{stats.registrations?.total_registrations || 0}</strong>
                <small className="metric-sub">{stats.registrations?.attended_registrations || 0} Attended</small>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="dashboard-nav-tabs">
          <button
            className={`dash-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Analytics Overview
          </button>
          <button
            className={`dash-tab ${activeTab === 'clubs' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            🏛️ Clubs ({clubs.length})
          </button>
          <button
            className={`dash-tab ${activeTab === 'categories' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            🏷️ Categories ({categories.length})
          </button>
          <button
            className={`dash-tab ${activeTab === 'users' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users & Roles ({users.length})
          </button>
          <button
            className={`dash-tab ${activeTab === 'events' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            📅 All Events ({events.length})
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="tab-pane">
            <div className="content-card">
              <h3>Top Popular Events by Student Registration</h3>
              <p className="card-subtext">Highest enrolled events across all student clubs</p>

              {stats?.topEvents?.length === 0 ? (
                <p className="text-muted">No registrations recorded yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Event Title</th>
                        <th>Host Club</th>
                        <th>Event Date</th>
                        <th>Registered Students</th>
                        <th>Capacity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.topEvents?.map((ev) => (
                        <tr key={ev.id}>
                          <td>
                            <Link to={`/events/${ev.id}`}>
                              <strong>{ev.title}</strong>
                            </Link>
                          </td>
                          <td>{ev.club_name}</td>
                          <td>{ev.event_date}</td>
                          <td>
                            <strong className="text-primary">{ev.registered_count}</strong>
                          </td>
                          <td>{ev.max_participants}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Clubs Management */}
        {activeTab === 'clubs' && (
          <div className="tab-pane">
            <div className="content-card">
              <div className="card-header-bar">
                <div>
                  <h3>Campus Clubs & Organizations</h3>
                  <p className="card-subtext">Add clubs and assign staff/student coordinators</p>
                </div>
                <button
                  onClick={() => {
                    setEditingClub(null);
                    setClubForm({ club_name: '', description: '', coordinator_id: '' });
                    setClubModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  + Add New Club
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Club Name</th>
                      <th>Description</th>
                      <th>Assigned Coordinator</th>
                      <th>Members</th>
                      <th>Events</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.club_name}</strong>
                        </td>
                        <td>
                          <span className="table-desc-text">
                            {c.description ? c.description.substring(0, 80) : '—'}
                          </span>
                        </td>
                        <td>
                          {c.coordinator_name ? (
                            <span>{c.coordinator_name} <br/><small className="text-muted">{c.coordinator_email}</small></span>
                          ) : (
                            <Badge variant="warning">Unassigned</Badge>
                          )}
                        </td>
                        <td>{c.member_count || 0}</td>
                        <td>{c.event_count || 0}</td>
                        <td>
                          <div className="table-action-btns">
                            <button
                              onClick={() => {
                                setEditingClub(c);
                                setClubForm({
                                  club_name: c.club_name,
                                  description: c.description || '',
                                  coordinator_id: c.coordinator_id || ''
                                });
                                setClubModalOpen(true);
                              }}
                              className="btn btn-outline-secondary btn-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClub(c.id)}
                              className="btn btn-outline-danger btn-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Categories Management */}
        {activeTab === 'categories' && (
          <div className="tab-pane">
            <div className="content-card">
              <div className="card-header-bar">
                <div>
                  <h3>Event Categories</h3>
                  <p className="card-subtext">Manage tags for categorizing campus activities</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCatForm({ category_name: '', description: '' });
                    setCategoryModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  + Add Category
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th>Linked Events</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td>
                          <strong>{cat.category_name}</strong>
                        </td>
                        <td>{cat.description || '—'}</td>
                        <td>{cat.event_count || 0}</td>
                        <td>
                          <div className="table-action-btns">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCatForm({
                                  category_name: cat.category_name,
                                  description: cat.description || ''
                                });
                                setCategoryModalOpen(true);
                              }}
                              className="btn btn-outline-secondary btn-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="btn btn-outline-danger btn-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Users & Roles */}
        {activeTab === 'users' && (
          <div className="tab-pane">
            <div className="content-card">
              <div className="card-header-bar">
                <div>
                  <h3>User Accounts & Role Permissions</h3>
                  <p className="card-subtext">Promote students to coordinators or platform administrators</p>
                </div>

                <div className="table-filters">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="form-control"
                    style={{ width: '220px' }}
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="select-filter"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Assigned Club</th>
                      <th>Registered On</th>
                      <th>Change Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          {u.id === user.id && <span className="text-muted"> (You)</span>}
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <Badge
                            variant={
                              u.role === 'admin'
                                ? 'danger'
                                : u.role === 'coordinator'
                                ? 'warning'
                                : 'primary'
                            }
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{u.managed_club_name || '—'}</td>
                        <td>{u.created_at ? u.created_at.substring(0, 10) : '—'}</td>
                        <td>
                          <select
                            value={u.role}
                            disabled={u.id === user.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="status-quick-select"
                          >
                            <option value="student">Student</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: All Campus Events */}
        {activeTab === 'events' && (
          <div className="tab-pane">
            <div className="content-card">
              <div className="card-header-bar">
                <div>
                  <h3>Campus-Wide Events Directory</h3>
                  <p className="card-subtext">Global oversight of all scheduled and draft events</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Club & Category</th>
                      <th>Date</th>
                      <th>Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td>
                          <strong>
                            <Link to={`/events/${ev.id}`}>{ev.title}</Link>
                          </strong>
                        </td>
                        <td>
                          {ev.club_name} &bull; {ev.category_name}
                        </td>
                        <td>{ev.event_date}</td>
                        <td>
                          {ev.registered_count || 0} / {ev.max_participants}
                        </td>
                        <td>
                          <StatusBadge status={ev.status} />
                        </td>
                        <td>
                          <div className="table-action-btns">
                            <Link to={`/events/${ev.id}`} className="btn btn-outline-secondary btn-xs">
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="btn btn-outline-danger btn-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Club Modal */}
      <Modal
        isOpen={clubModalOpen}
        onClose={() => setClubModalOpen(false)}
        title={editingClub ? 'Edit Campus Club' : 'Create New Campus Club'}
        maxWidth="550px"
      >
        <form onSubmit={handleSaveClub} className="form-vertical">
          <div className="form-group">
            <label htmlFor="modal-club-name">Club Name *</label>
            <input
              id="modal-club-name"
              type="text"
              required
              placeholder="e.g. Coding Club, Robotics Society, Dance Troupe"
              value={clubForm.club_name}
              onChange={(e) => setClubForm({ ...clubForm, club_name: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="modal-club-desc">Description</label>
            <textarea
              id="modal-club-desc"
              rows="3"
              placeholder="Overview of the club's purpose and activities..."
              value={clubForm.description}
              onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
              className="form-control"
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="modal-coord-select">Assign Coordinator (Faculty or Student Lead)</label>
            <select
              id="modal-coord-select"
              value={clubForm.coordinator_id}
              onChange={(e) => setClubForm({ ...clubForm, coordinator_id: e.target.value })}
              className="form-control"
            >
              <option value="">No coordinator assigned</option>
              {coordinatorUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — [{u.role.toUpperCase()}]
                </option>
              ))}
            </select>
            <small className="help-text">
              Note: To assign a user as coordinator, their account role must be set to Coordinator or Admin.
            </small>
          </div>

          <div className="modal-actions-right">
            <button
              type="button"
              onClick={() => setClubModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingClub ? 'Update Club' : 'Create Club'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Event Category'}
        maxWidth="500px"
      >
        <form onSubmit={handleSaveCategory} className="form-vertical">
          <div className="form-group">
            <label htmlFor="cat-name">Category Name *</label>
            <input
              id="cat-name"
              type="text"
              required
              placeholder="e.g. Technical, Cultural, Sports, Hackathon"
              value={catForm.category_name}
              onChange={(e) => setCatForm({ ...catForm, category_name: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              rows="2"
              placeholder="Brief description of category..."
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              className="form-control"
            ></textarea>
          </div>

          <div className="modal-actions-right">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
