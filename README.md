# Campus Event Management System

A full-stack web application designed for universities and colleges to streamline event creation, student club activities, event registrations, attendance tracking, and administrative governance.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js (v5), MySQL (`mysql2/promise`), JWT (`jsonwebtoken`), `bcrypt`, `cors`, `dotenv`.
* **Frontend:** React 19, Vite, React Router v7, Axios, Modern Responsive CSS.
* **Database:** MySQL relational database (`schema.sql`).

---

## 🚀 Getting Started

### 1. Database Setup
Make sure MySQL is running and execute the schema:
```sql
mysql -u root -p < database/schema.sql
```

### 2. Backend Configuration & Startup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Check your `.env` settings:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=campus_event_management
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   ```
3. *(Optional)* Seed initial test accounts, clubs, categories, and sample events:
   ```bash
   npm run seed
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   * Backend will be accessible at: `http://localhost:5000`
   * Health Check: `http://localhost:5000/api/health`

### 3. Frontend Startup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * Frontend will be accessible at: `http://localhost:5173`

### 4. Deploy on Render
1. Create a MySQL database with a MySQL-compatible hosting provider. Render Blueprints can provision PostgreSQL, but this application currently uses MySQL.
2. In Render, create a new Blueprint from this GitHub repository's `main` branch and approve the `render.yaml` configuration. Render will build the root `Dockerfile` and serve the frontend and API from one web service.
3. Enter the MySQL connection values when prompted: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. The Blueprint generates a `JWT_SECRET`. Keep these values private.
4. After the first deploy, initialize the MySQL database by running `database/schema.sql` against it. Optionally run `npm run seed` from `backend/` once to add demo users, clubs, categories, and events.
5. Open the Render service's public URL. Its health check is configured at `/api/health`.

The free web service may spin down after inactivity, and external database providers may charge separately. The seed script may create duplicate events if run more than once.

---

## 👥 Default Demo Accounts (from `npm run seed`)

| Role | Email | Password | Capabilities |
|---|---|---|---|
| **Admin** | `admin@campus.edu` | `Admin@123` | Full system control: Manage clubs, assign coordinators, manage categories, promote user roles, oversee all campus events & platform analytics. |
| **Coordinator** | `coordinator@campus.edu` | `Coord@123` | Create & manage events for assigned club, edit schedules, view attendee rosters, check-in attendees. |
| **Student** | `student@campus.edu` | `Student@123` | Discover events, 1-click registration/cancellation, join/leave campus clubs, view registrations in student hub. |

---

## 📁 Project Architecture

```
Campus-Event-Management/
├── backend/
│   ├── config/
│   │   └── database.js             # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, Me, Profile update
│   │   ├── eventController.js      # CRUD events, search/filters, status lifecycle
│   │   ├── registrationController.js # Event register, cancel, attendees, check-in
│   │   ├── clubController.js       # CRUD clubs, membership join/leave
│   │   ├── categoryController.js   # CRUD event categories
│   │   ├── userController.js       # User list & role promotion
│   │   └── statsController.js      # Admin & coordinator analytics
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification
│   │   ├── authorize.js            # Role-Based Access Control (RBAC)
│   │   └── errorHandler.js         # Centralized error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── registrationRoutes.js
│   │   ├── clubRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── userRoutes.js
│   │   └── statsRoutes.js
│   ├── utils/
│   │   ├── response.js             # Standard API response formatting
│   │   └── seed.js                 # Database seeder with sample data
│   ├── server.js                   # Express server entry point
│   └── .env                        # Environment configuration
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Navbar, Footer, Modal, Badge, ProtectedRoute
│   │   │   └── events/             # EventCard, EventFormModal, AttendeeRosterModal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # User authentication & session state
│   │   │   └── ToastContext.jsx    # Application-wide toast notifications
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Event discovery, filters, search
│   │   │   ├── EventDetailsPage.jsx# Details, countdown, 1-click register
│   │   │   ├── ClubsPage.jsx       # Campus clubs directory
│   │   │   ├── LoginPage.jsx       # Sign in
│   │   │   ├── RegisterPage.jsx    # Student account creation
│   │   │   ├── student/            # Student Dashboard (My Registrations & Clubs)
│   │   │   ├── coordinator/        # Coordinator Hub (Events & Attendance)
│   │   │   └── admin/              # Admin Console (Clubs, Categories, Roles)
│   │   ├── services/               # Axios API client & services
│   │   ├── App.jsx                 # Routing configuration
│   │   └── index.css / App.css     # Responsive design system
│   └── vite.config.js              # Vite config with backend API proxy
│
└── database/
    └── schema.sql                  # MySQL database tables & constraints
```
