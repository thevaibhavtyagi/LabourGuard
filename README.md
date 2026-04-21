# LabourGuard

A privacy-focused system for managing labour law compliance without relying on intrusive monitoring.

LabourGuard tracks working hours and checks compliance with basic labour regulations while keeping employee data collection minimal.

---

## Overview

Most compliance systems rely on continuous tracking. LabourGuard takes a simpler approach — it logs only essential activity and evaluates compliance based on that.

The system focuses on:
- Recording work sessions (check-in / check-out)
- Calculating daily and weekly hours
- Identifying basic compliance violations

---

## Key Ideas

- **Minimal Data Collection**  
  Only basic identity (name, email) and work timestamps are stored.

- **No Intrusive Monitoring**  
  No location tracking, screen recording, or keystroke logging.

- **Server-Side Compliance Logic**  
  All compliance checks are handled on the backend to avoid client-side manipulation.

---

## Tech Stack

**Frontend**
- HTML, CSS, JavaScript (Vanilla)

**Backend**
- Node.js, Express.js
- MongoDB (Mongoose)

**Authentication & Security**
- JWT (authentication)
- bcrypt (password hashing)

**Deployment**
- Vercel (serverless functions)

---

## How It Works

1. **User Authentication**  
   Users sign up and log in securely.

2. **Work Sessions**  
   Employees check in and check out to log work hours.

3. **Compliance Checks**  
   The backend evaluates:
   - Daily working hours  
   - Weekly working hours  
   - Continuous work duration  

4. **Employer View**  
   Employers can view logs, summaries, and violations.

---

## Basic Compliance Rules

- Daily limit: 9 hours  
- Weekly limit: 48 hours  
- Continuous work: 5 hours without break (warning)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB

## Setup

Clone the repository:

```bash
git clone https://github.com/thevaibhavtyagi/LabourGuard
cd LabourGuard
````

Create a `.env` file in the backend directory:

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
PORT=5000
```

Install dependencies and start the backend:

```bash
cd backend
npm install
npm run dev
```

Run the frontend using any static server:

```bash
cd frontend/pages
npx serve
```

---

## Project Structure

```
backend/   - API, database, and core logic  
frontend/  - UI and client-side code  
```

---

## Notes

* This project was built as part of an academic exercise.
* It focuses on a privacy-aware approach to compliance systems.
