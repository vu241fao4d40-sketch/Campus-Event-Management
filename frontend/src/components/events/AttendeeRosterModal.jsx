import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge } from '../common/Badge';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';

export const AttendeeRosterModal = ({ isOpen, onClose, eventId, eventTitle }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');
  const { showToast } = useToast();

  const loadAttendees = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const res = await registrationService.getEventAttendees(eventId);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch attendees.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      loadAttendees();
    }
  }, [isOpen, eventId]);

  const handleStatusChange = async (registrationId, newStatus) => {
    try {
      await registrationService.updateAttendance(registrationId, newStatus);
      showToast(`Attendee marked as ${newStatus}!`, 'success');
      loadAttendees();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update attendance.', 'error');
    }
  };

  const filteredAttendees = (data?.attendees || []).filter(
    (a) =>
      a.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(filterTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attendee Roster — ${eventTitle || 'Event'}`}
      maxWidth="850px"
    >
      <div className="roster-container">
        {loading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading attendees list...</p>
          </div>
        ) : (
          <>
            <div className="roster-metrics">
              <div className="metric-chip">
                <span>Total Registered</span>
                <strong>{data?.total_registered || 0}</strong>
              </div>
              <div className="metric-chip">
                <span>Checked In / Attended</span>
                <strong className="text-success">{data?.total_attended || 0}</strong>
              </div>
              <div className="metric-chip">
                <span>Capacity</span>
                <strong>{data?.max_participants || 0}</strong>
              </div>
            </div>

            <div className="roster-search-bar">
              <input
                type="text"
                placeholder="Search attendee by name or email..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="form-control"
              />
            </div>

            {filteredAttendees.length === 0 ? (
              <div className="empty-state-box">
                <p>No attendees found matching your criteria.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Registered At</th>
                      <th>Status</th>
                      <th>Attendance Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.map((att, idx) => (
                      <tr key={att.registration_id}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{att.name}</strong>
                        </td>
                        <td>{att.email}</td>
                        <td>{att.registered_at ? att.registered_at.substring(0, 16) : '—'}</td>
                        <td>
                          <StatusBadge status={att.registration_status} />
                        </td>
                        <td>
                          <div className="table-action-btns">
                            {att.registration_status !== 'attended' && (
                              <button
                                onClick={() => handleStatusChange(att.registration_id, 'attended')}
                                className="btn btn-outline-success btn-xs"
                                title="Mark as Attended"
                              >
                                ✓ Check In
                              </button>
                            )}
                            {att.registration_status === 'attended' && (
                              <button
                                onClick={() => handleStatusChange(att.registration_id, 'registered')}
                                className="btn btn-outline-secondary btn-xs"
                                title="Revert to Registered"
                              >
                                Undo
                              </button>
                            )}
                            {att.registration_status !== 'cancelled' && (
                              <button
                                onClick={() => handleStatusChange(att.registration_id, 'cancelled')}
                                className="btn btn-outline-danger btn-xs"
                                title="Cancel registration"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
