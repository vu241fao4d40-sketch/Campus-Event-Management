import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, StatusBadge } from '../common/Badge';

export const EventCard = ({ event }) => {
  const isFull = event.seats_remaining <= 0;
  const isPast = new Date(event.event_date) < new Date(new Date().toDateString());
  const percentFull = Math.min(
    100,
    Math.round(((event.registered_count || 0) / (event.max_participants || 1)) * 100)
  );

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
    // Format "14:30:00" to "2:30 PM"
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  };

  return (
    <article className="event-card">
      <div className="event-card-header">
        <span className="event-category-tag">{event.category_name}</span>
        {event.status !== 'published' ? (
          <StatusBadge status={event.status} />
        ) : isFull ? (
          <Badge variant="danger">FULL</Badge>
        ) : isPast ? (
          <Badge variant="neutral">PAST</Badge>
        ) : (
          <Badge variant="success">OPEN</Badge>
        )}
      </div>

      <div className="event-card-body">
        <div className="event-club-name">
          <span className="club-bullet">●</span> {event.club_name}
        </div>

        <h3 className="event-title">
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        <p className="event-snippet">
          {event.description
            ? event.description.length > 110
              ? `${event.description.substring(0, 110)}...`
              : event.description
            : 'No description provided.'}
        </p>

        <div className="event-meta-list">
          <div className="meta-item">
            <span className="meta-icon">📅</span>
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">⏰</span>
            <span>
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span>{event.venue}</span>
          </div>
        </div>

        <div className="event-capacity-container">
          <div className="capacity-labels">
            <span>Capacity</span>
            <strong>
              {event.registered_count || 0} / {event.max_participants} ({event.seats_remaining} seats left)
            </strong>
          </div>
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${percentFull >= 90 ? 'is-high' : percentFull >= 60 ? 'is-medium' : ''}`}
              style={{ width: `${percentFull}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="event-card-footer">
        {event.user_registration_status === 'registered' && (
          <span className="user-registered-tag">✓ You are registered</span>
        )}
        <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm event-action-btn">
          View Details
        </Link>
      </div>
    </article>
  );
};
