# LabourGuard

**Privacy-First Labour Law Compliance System**

LabourGuard is a production-ready web application that ensures labour law compliance while minimizing employee data intrusion. Track working hours and monitor compliance with legal constraints — without invasive surveillance.

## Core Principles

- **Privacy First**: No location tracking, screen monitoring, keystroke logging, or background surveillance
- **Essential Data Only**: We only collect name, email, work timestamps, and computed hours
- **Compliance Focused**: Automatic detection of labour law violations (daily hours, weekly hours, break requirements)

## Project Structure

```
labourguard/
├── backend/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── workController.js    # Work session management
│   │   ├── complianceController.js # Compliance checking
│   │   ├── employerController.js   # Employer operations
│   │   └── index.js
│   ├── middleware/
│   │   └── auth.js              # JWT authentication & authorization
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── WorkLog.js           # Work session schema
│   │   ├── Violation.js         # Compliance violation schema
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth endpoints
│   │   ├── workRoutes.js        # /api/work endpoints
│   │   ├── complianceRoutes.js  # /api/compliance endpoints
│   │   ├── employerRoutes.js    # /api/employer endpoints
│   │   └── index.js
│   ├── services/
│   │   ├── complianceEngine.js  # Compliance evaluation logic
│   │   └── index.js
│   ├── server.js                # Express entry point
│   └── package.json             # Backend dependencies
├── frontend/
│   ├── js/
│   │   ├── core/
│   │   │   ├── api.js           # API client utilities
│   │   │   ├── auth.js          # Authentication utilities
│   │   │   ├── router.js        # Route guards
│   │   │   └── storage.js       # Local storage utilities
│   │   └── pages/
│   │       ├── dashboard.js     # Employee dashboard logic
│   │       ├── employer-dashboard.js # Employer dashboard logic
│   │       ├── landing.js       # Landing page logic
│   │       ├── login.js         # Login form handling
│   │       ├── privacy.js       # Privacy page interactions
│   │       └── signup.js        # Signup form handling
│   ├── pages/
│   │   ├── dashboard.html       # Employee dashboard
│   │   ├── employer-dashboard.html # Employer dashboard
│   │   ├── index.html           # Landing page
│   │   ├── login.html           # Login page
│   │   ├── privacy.html         # Privacy policy page
│   │   └── signup.html          # Signup page
│   └── styles/
│       ├── components.css       # Component styles
│       └── global.css           # Global styles & CSS variables
├── .env.example                 # Environment variables template
├── package.json                 # Root project configuration
└── README.md                    # This file
```

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- No frameworks - vanilla JS with modular architecture
- Google Fonts (Inter, Poppins)
- Responsive design with mobile-first approach

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/labourguard.git
   cd labourguard
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```env
   MONGO_URI=mongodb://localhost:27017/labourguard
   JWT_SECRET=your_secure_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   ```

4. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

The frontend uses vanilla HTML/CSS/JS and can be served by any static file server:

```bash
# Using Python
cd frontend/pages
python -m http.server 3000

# Using Node.js serve
npx serve frontend/pages
```

Open `http://localhost:3000/index.html` in your browser.

## Development Phases

### Phase 1 - Foundation (Complete)
- [x] Full folder structure
- [x] Backend server setup with Express
- [x] MongoDB connection with Mongoose
- [x] Landing page with premium SaaS design
- [x] Login and signup UI

### Phase 2 - Authentication (Complete)
- [x] User registration with validation
- [x] Login with JWT tokens
- [x] Password hashing with bcrypt
- [x] Protected route middleware
- [x] Role-based authorization

### Phase 3 - Employee Dashboard (Complete)
- [x] Check-in/check-out functionality
- [x] Live timer display
- [x] Daily/weekly hours summary
- [x] Work log history
- [x] Session management

### Phase 4 - Compliance Engine (Complete)
- [x] Dedicated compliance service
- [x] Daily hours violation detection (>9 hours)
- [x] Weekly hours violation detection (>48 hours)
- [x] Break requirement warnings (>5 hours continuous)
- [x] Violation storage and retrieval
- [x] Real-time compliance alerts

### Phase 5 - Employer Dashboard (Complete)
- [x] Employee overview table
- [x] Work hours analytics
- [x] Violation tracking
- [x] Filtering by compliance status
- [x] Daily/weekly/monthly views

### Phase 6 - Final Polish (Complete)
- [x] Comprehensive privacy page
- [x] Responsive design refinements
- [x] Accessibility improvements
- [x] Print styles
- [x] Reduced motion support
- [x] High contrast mode support

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/logout` | Logout |

### Work Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/work/checkin` | Start work session |
| POST | `/api/work/checkout` | End work session |
| GET | `/api/work/session` | Get active session |
| GET | `/api/work/logs` | Get work history |
| GET | `/api/work/summary/daily` | Get daily summary |
| GET | `/api/work/summary/weekly` | Get weekly summary |

### Compliance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/status` | Get compliance status |
| GET | `/api/compliance/violations` | Get violation history |
| GET | `/api/compliance/stats` | Get violation statistics |
| POST | `/api/compliance/violations/:id/acknowledge` | Acknowledge violation |

### Employer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employer/employees` | Get all employees |
| GET | `/api/employer/employees/:id/logs` | Get employee work logs |
| GET | `/api/employer/analytics` | Get analytics data |
| GET | `/api/employer/violations` | Get all violations |

## Compliance Rules

| Rule | Limit | Severity |
|------|-------|----------|
| Daily Hours | 9 hours max | Violation |
| Weekly Hours | 48 hours max | Violation |
| Continuous Work | 5 hours without break | Warning |

## Privacy Commitments

LabourGuard explicitly **does NOT** collect:
- Location data (GPS, IP-based, geofencing)
- Screen captures or recordings
- Keystroke logging
- Application/website usage
- Mouse movements or activity levels
- Webcam or microphone access
- Background process data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License

---

**Built with privacy in mind.**

LabourGuard demonstrates that workplace compliance and employee privacy can coexist. Organizations can ensure labour law compliance without resorting to invasive surveillance.
