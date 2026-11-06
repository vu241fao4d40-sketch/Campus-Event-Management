import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { categoryService } from '../services/categoryService';
import { clubService } from '../services/clubService';
import { EventCard } from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [timeframe, setTimeframe] = useState('upcoming'); // 'upcoming', 'past', 'all'

  // Fetch categories and clubs on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, clubsRes] = await Promise.all([
          categoryService.getAllCategories(),
          clubService.getAllClubs()
        ]);
        if (catsRes && catsRes.data) setCategories(catsRes.data);
        if (clubsRes && clubsRes.data) setClubs(clubsRes.data);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch events whenever filters change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = {
          timeframe,
          search: searchTerm || undefined,
          category_id: selectedCategory || undefined,
          club_id: selectedClub || undefined
        };
        const res = await eventService.getAllEvents(params);
        if (res && res.data) {
          setEvents(res.data);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search input slightly
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedClub, timeframe]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">Campus Event Hub</div>
          <h1 className="hero-title">Experience Campus Life to the Fullest</h1>
          <p className="hero-subtitle">
            Discover workshops, hackathons, cultural festivals, sports tournaments, and club activities happening across your university campus.
          </p>

          <div className="hero-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by event title, venue, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hero-search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="hero-quick-links">
            <span className="quick-label">Popular Categories:</span>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`category-pill-btn ${selectedCategory === cat.id ? 'is-active' : ''}`}
              >
                {cat.category_name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="main-content-container">
        {/* Filters and Controls Bar */}
        <div className="controls-bar">
          <div className="timeframe-tabs">
            <button
              className={`tab-btn ${timeframe === 'upcoming' ? 'active' : ''}`}
              onClick={() => setTimeframe('upcoming')}
            >
              Upcoming Events
            </button>
            <button
              className={`tab-btn ${timeframe === 'past' ? 'active' : ''}`}
              onClick={() => setTimeframe('past')}
            >
              Past Archive
            </button>
            <button
              className={`tab-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Events
            </button>
          </div>

          <div className="dropdown-filters">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select-filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name} ({c.event_count || 0})
                </option>
              ))}
            </select>

            {/* Club Filter */}
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="select-filter"
            >
              <option value="">All Clubs</option>
              {clubs.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.club_name}
                </option>
              ))}
            </select>

            {(selectedCategory || selectedClub || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedClub('');
                  setSearchTerm('');
                }}
                className="btn btn-ghost btn-sm reset-filters-btn"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <section className="events-section">
          <div className="section-header">
            <h2>
              {timeframe === 'upcoming' ? 'Upcoming Campus Events' : timeframe === 'past' ? 'Past Events Archive' : 'All Events'}
              <span className="results-count">({events.length} {events.length === 1 ? 'event' : 'events'})</span>
            </h2>

            {isAuthenticated && (user?.role === 'coordinator' || user?.role === 'admin') && (
              <Link to="/coordinator" className="btn btn-outline-primary btn-sm">
                + Create Event
              </Link>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Fetching campus events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon">📅</div>
              <h3>No Events Found</h3>
              <p>We couldn't find any events matching your selected criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedClub('');
                  setSearchTerm('');
                  setTimeframe('all');
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
