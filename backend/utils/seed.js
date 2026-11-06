const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

async function seed() {
  console.log('🌱 Starting database seeding for Campus Event Management...');

  try {
    // 1. Seed Users
    const saltRounds = 10;
    const adminPass = await bcrypt.hash('Admin@123', saltRounds);
    const coordPass = await bcrypt.hash('Coord@123', saltRounds);
    const studentPass = await bcrypt.hash('Student@123', saltRounds);

    console.log('Inserting default users (Admin, Coordinator, Student)...');
    
    // Admin
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'admin'`,
      ['System Administrator', 'admin@campus.edu', adminPass]
    );

    // Coordinator
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'coordinator')
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'coordinator'`,
      ['Prof. Alan Smith', 'coordinator@campus.edu', coordPass]
    );

    // Student
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'student')
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = 'student'`,
      ['Jordan Lee', 'student@campus.edu', studentPass]
    );

    // Get user IDs
    const [adminRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@campus.edu']);
    const [coordRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['coordinator@campus.edu']);
    const [studentRows] = await pool.query('SELECT id FROM users WHERE email = ?', ['student@campus.edu']);

    const adminId = adminRows[0].id;
    const coordId = coordRows[0].id;
    const studentId = studentRows[0].id;

    // 2. Seed Categories
    console.log('Inserting event categories...');
    const categories = [
      ['Technical & Coding', 'Coding contests, hackathons, and tech workshops.'],
      ['Cultural & Arts', 'Music festivals, drama, dance, and creative arts.'],
      ['Sports & Athletics', 'Inter-department sports tournaments and fitness events.'],
      ['Workshops & Seminars', 'Educational seminars, guest lectures, and career panels.']
    ];

    for (const [name, desc] of categories) {
      await pool.query(
        `INSERT INTO event_categories (category_name, description)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [name, desc]
      );
    }

    const [techCat] = await pool.query('SELECT id FROM event_categories WHERE category_name = ?', ['Technical & Coding']);
    const [culturalCat] = await pool.query('SELECT id FROM event_categories WHERE category_name = ?', ['Cultural & Arts']);
    const [sportsCat] = await pool.query('SELECT id FROM event_categories WHERE category_name = ?', ['Sports & Athletics']);

    // 3. Seed Clubs
    console.log('Inserting campus clubs...');
    await pool.query(
      `INSERT INTO clubs (club_name, description, coordinator_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description), coordinator_id = VALUES(coordinator_id)`,
      ['Coding & Algorithms Society', 'Focused on competitive programming, web development, and open source projects.', coordId]
    );

    await pool.query(
      `INSERT INTO clubs (club_name, description, coordinator_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description)`,
      ['Music & Dramatic Society', 'Promoting musical talent, theatrical plays, and creative campus performances.', null]
    );

    await pool.query(
      `INSERT INTO clubs (club_name, description, coordinator_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description)`,
      ['Campus Athletics League', 'Organizing football, badminton, and basketball events across campus.', null]
    );

    const [codingClub] = await pool.query('SELECT id FROM clubs WHERE club_name = ?', ['Coding & Algorithms Society']);
    const [artsClub] = await pool.query('SELECT id FROM clubs WHERE club_name = ?', ['Music & Dramatic Society']);

    // 4. Seed Club Membership
    await pool.query(
      `INSERT IGNORE INTO club_members (club_id, user_id) VALUES (?, ?)`,
      [codingClub[0].id, studentId]
    );

    // 5. Seed Events
    console.log('Inserting sample upcoming campus events...');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const eventDateStr = nextWeek.toISOString().slice(0, 10);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);
    const deadlineStr = deadline.toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `INSERT INTO events (
        club_id, category_id, created_by, title, description, venue,
        event_date, start_time, end_time, registration_deadline, max_participants, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codingClub[0].id,
        techCat[0].id,
        coordId,
        'Campus Hackathon 2026: Code the Future',
        '24-hour sprint building real-world solutions with web technologies, AI APIs, and cloud services. Exciting prizes for top teams!',
        'Main Engineering Block, Hall 302',
        eventDateStr,
        '09:00:00',
        '18:00:00',
        deadlineStr,
        100,
        'published'
      ]
    );

    const nextTwoWeeks = new Date();
    nextTwoWeeks.setDate(nextTwoWeeks.getDate() + 14);
    const artsDateStr = nextTwoWeeks.toISOString().slice(0, 10);

    const artsDeadline = new Date();
    artsDeadline.setDate(artsDeadline.getDate() + 12);
    const artsDeadlineStr = artsDeadline.toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `INSERT INTO events (
        club_id, category_id, created_by, title, description, venue,
        event_date, start_time, end_time, registration_deadline, max_participants, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artsClub[0].id,
        culturalCat[0].id,
        adminId,
        'Annual Acoustic Night & Open Mic',
        'An evening of acoustic melodies, poetry, and standup comedy performed by talented campus artists.',
        'Open Air Theatre (OAT)',
        artsDateStr,
        '17:30:00',
        '21:00:00',
        artsDeadlineStr,
        250,
        'published'
      ]
    );

    console.log('✅ Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Default Credentials:');
    console.log('  Admin:       admin@campus.edu       / Admin@123');
    console.log('  Coordinator: coordinator@campus.edu / Coord@123');
    console.log('  Student:     student@campus.edu     / Student@123');
    console.log('----------------------------------------------------');
  } catch (error) {
    console.error('Seeding error:', error.message);
  } finally {
    process.exit(0);
  }
}

seed();
