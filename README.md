# 🛡️ LabourGuard
**Enterprise Privacy-First Labour Compliance Engine**

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

LabourGuard is a robust, Zero-Knowledge architecture system designed to manage and enforce statutory labour law compliance. It perfectly balances an organization's need for strict legal compliance with the fundamental right to employee privacy by eliminating invasive surveillance methods like screen monitoring and continuous location tracking.

---

## 🔗 Live Deployment
The application is fully deployed and accessible at: **https://labourguard.vercel.app/**

---

## 🎯 Core Philosophy
Modern compliance systems rely heavily on continuous, intrusive tracking. LabourGuard redefines this by securely logging only cryptographic timestamps (Check-In / Check-Out) and processing all legal compliance calculations strictly on the server-side. This prevents client-side tampering while maintaining absolute employee anonymity outside of active working hours.

---

## ✨ Key Features
- **Frictionless Cryptographic Check-in:** One-click secure session generation.
- **Background Compliance Engine:** Asynchronous server-side evaluation of statutory limits.
- **Immutable Audit Logging:** Tamper-proof record generation for employer dashboards.
- **Role-Based Access Control (RBAC):** Strict data segregation between `employee` telemetry and `employer` administrative oversight.
- **Zero-Gap Telemetry:** Continuous array generation for seamless frontend charting, preventing UI breaks on non-working days.

---

## ⚖️ Statutory Compliance Rules
The backend engine is currently calibrated to monitor and automatically flag the following standard labour regulations:
- **Daily Threshold:** 9 Hours maximum limit.
- **Weekly Threshold:** 48 Hours maximum limit.
- **Rest Period Requirement:** Alert triggered upon 5 hours of continuous work without a logged break.

---

## 💻 Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** Node.js, Express.js (REST API Architecture)
* **Database:** MongoDB (Mongoose ODM)
* **Security:** JSON Web Tokens (JWT) for stateless auth, bcryptjs for cryptographic hashing
* **Deployment:** Vercel (Serverless Edge Functions)

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js (v18.0 or higher)
- MongoDB URI (Local or Atlas)
- Git

### Installation

1. **Clone the Repository**
   ```bash
   git clone [https://github.com/thevaibhavtyagi/LabourGuard.git](https://github.com/thevaibhavtyagi/LabourGuard.git)
   cd LabourGuard
   

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   FRONTEND_URL=http://localhost:3000
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Configuration**
   Open a new terminal window and serve the frontend:
   ```bash
   cd frontend
   npx serve -l 3000
   ```
   *Access the application at `http://localhost:3000`*

---

## 📁 High-Level Architecture
```text
LabourGuard/
├── backend/          # Express REST API, Mongoose Models, Compliance Engine, Auth Middleware
└── frontend/         # Client-side UI, API integration scripts, Dashboard visualizations
```

---

## 👥 Core Engineering Team

* **Vaibhav Tyagi**  
  *System Architecture & Backend Core*  
  Designed the Mongoose database schemas, built the background compliance engine, established API security, and engineered the complete Employee dashboard data pipeline.

* **Sarthak Singh**  
  *Employer Dashboard Engineering*  
  Developed the Employer UI, integrated complex telemetry data streams, and engineered the data visualization charts for real-time compliance tracking.

* **Kundan Pandey**  
  *Authentication & Security Interfaces*  
  Engineered the secure Login and Sign-up flows, integrated JWT storage mechanisms on the client side, and ensured seamless Role-Based routing.
