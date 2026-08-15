# Examin - Online Examination & Assessment System 🎓

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)
![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini%201.5-8E44AD?style=for-the-badge&logo=google)

Comprehensive documentation for the **Examin** platform, detailing system architecture, user roles, proctoring security, machine-readable vision AI defense, database models, Google Gemini AI exam generation, API specifications, and deployment guidelines.

---

## 📌 Project Overview

**Examin** is an enterprise-grade full-stack web application designed for educational institutions, schools, and examination authorities to conduct secure online assessments. It features **real-time Google Gemini AI question generation**, **AI Exam & Question Builder**, **machine-readable Vision AI exam-question detection & repeating watermarks**, **automated MCQ grading**, **leaderboard rankings**, **live proctor violation monitoring**, **Registered Students directory**, **Connected Institution Portals**, and **Super Admin platform governance**.

---

## ✨ Features & Capabilities

### 🛡️ Independent Anti-Cheating & Proctoring Suite (Level 1 & Level 3)
* **Independent Violation Tracking**: Tab Switches and Fullscreen Exits are tracked and calculated **completely independently**:
  * **Tab Switches**: Increments strictly on browser tab changes (`visibilitychange`) or window blur (`window.blur`).
  * **Fullscreen Exits**: Increments strictly when exiting browser fullscreen mode (`fullscreenchange`).
* **Real-time Exam Header Counter Badges**: Displays synchronous real-time badges directly in the student exam attempt header:
  * `Tab Switches: X/3`
  * `Fullscreen Exits: X/3`
* **Violation Limit Auto-Termination**: Automatically terminates and submits tests with an `isTerminatedForCheating` flag if tab switches (>= 3), fullscreen exits (>= 3), or DevTools attempts occur.
* **Live Violation Monitoring Dashboard**: Real-time instructor view (`/admin/live-monitoring`) strictly displaying candidates terminated for instruction violations, with exact raw proctoring metrics and dynamic **Violation Reason Badges** (e.g. `Reason: 3 Fullscreen Exits`).
* **Single Active Login Control**: Strictly prevents simultaneous logins during active exam sessions.
* **Fisher-Yates Question & Option Randomization**: Shuffles question order and option choices per student session while preserving accurate backend answer grading.
* **Multi-Monitor & Extended Display Detector**: Detects if secondary monitors or extended displays are active (`window.screen.isExtended` / window geometry checks) and logs `multiMonitorDetected`.
* **Web Audio Noise & Speech Detector**: Captures microphone input via Web Audio API (`AnalyserNode`) to measure sound volume (RMS) and flag background noise (`audioViolations`).
* **DevTools Debugger Timing Inspector**: Periodically measures script execution delay around `debugger` statements to detect if Developer Tools are opened (`devToolsAttempts`).
* **Anti-Chrome Extension Defense**: Intercepts events before browser extensions can run content scripts.
* **Text Selection & Copy Poisoning**: Instantly clears text selection and overwrites clipboard payloads with security warnings.
* **Keyboard Shortcut Blocking**: Intercepts `PrintScreen`, `F12`, `Ctrl+Shift+I/J/C`, `Ctrl+P`, `Ctrl+U`, `Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+A`, `Ctrl+S`.

### 🤖 Google Gemini AI Exam & Question Builder
* **AI Exam Generator Modal**: Clean 2-column SaaS dashboard modal (`Difficulty Level` & `Number of Questions`) powered by Google Gemini (`/api/ai-exam/generate`) allowing instant test creation by topic prompt.
* **Multiple Choice Questions (MCQs)**: Generates structured, syllabus-aligned multiple choice questions with options, correct answer keys, and assigned marks.
* **Automatic Fallback Engine**: Built-in fallback question generator for uninterrupted availability.
* **Question Bank Integration**: Editable generated questions, options, correct answers, and category tagging.

### 🛡️ Vision AI Exam-Question Detector & Security Watermarking
* **Cryptographic Exam & Session Identifiers**: Backend generates cryptographically secure exam codes (`EXAM-7F82A91`) and student session tokens (`SESS-92831`).
* **Low-Opacity Security Watermark Grid**: 18-tile diagonal overlay grid rendered across question cards to prevent vision-capable external AIs from solving questions via screenshots.
* **AI Question Detector Endpoint (`/api/ai-exam/detect`)**: OCR and token verification engine that validates uploaded question images against active database sessions.

### 🎨 Enterprise Deep Navy Design Palette
* Professional **Deep Navy + Slate + White** aesthetic:
  * Primary: `#1E3A5F` (Deep Navy)
  * Accent: `#2563EB` (Refined Blue)
  * Background: `#F8FAFC`
  * Surface: `#FFFFFF`
  * Primary Text: `#0F172A`
  * Secondary Text: `#64748B`

### 🏫 Approved Schools & Connected Institution Portals
* **Approved Schools Directory**: Grid of active schools showing connected student count, exam count, and school admin.
* **Connected Institution Portal Modal**: Inspector modal allowing superadmins to manage approved schools, connected students, exams, and school admins.

### 👤 Student Directory & Credential Mailer
* **Registered Students Directory**: Directory listing Student Name, Email Address, 11-digit Student ID, Assigned Institution, and Registration Date.
* **Automated Credentials Dispatcher**: Instant email dispatch of 11-digit Student ID and Password upon registration via Gmail SMTP.

---

## 🔒 Security & Compliance

* **JWT Authentication**: Secure JSON Web Tokens stored with session management.
* **Role-Based Access Control (RBAC)**: Strict role separation between Students, Admins/Instructors, and Super Admin (`/api/superadmin/*` protected).
* **Proctoring Audit Trail**: Every tab switch, window blur, copy attempt, DevTools access, and AI detector flag recorded in submission records & system audit logs.
* **Database Encryption & Hashing**: Bcrypt password hashing (12 rounds) and sanitized inputs via express-validator.

---

## 📂 Project Directory & File Structure

```
examin/
├── .github/                        # CI/CD Workflows
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI build & verification pipeline
│
├── backend/                        # Node.js / Express Server
│   ├── controllers/                # Request handling logic
│   │   ├── authController.js       # Registration, login, password change & credential management
│   │   ├── examController.js       # Exam creation, active window calculation & token generation
│   │   ├── questionBankController.js# Question bank CRUD, CSV import & AI generation
│   │   ├── submissionController.js # Auto-evaluation, ExamSession deactivation & rank calculation
│   │   └── superAdminController.js # Analytics, audit logs, student directory & backup
│   ├── middleware/                 # Route guards & security
│   │   └── auth.js                 # JWT token verification & role authorization
│   ├── models/                     # Mongoose database schemas
│   │   ├── AuditLog.js             # System action audit trail
│   │   ├── Exam.js                 # Exam structure, examCode generator & passing marks
│   │   ├── ExamSession.js          # Student active exam session & sessionToken schema
│   │   ├── Institution.js          # Institutional subscription plan & limits
│   │   ├── Notification.js         # User dashboard notification alerts
│   │   ├── QuestionBank.js         # Question bank categories, difficulty & options
│   │   ├── Schedule.js             # Institutional demo schedule requests
│   │   ├── Submission.js           # Student test results, proctor logs & AI analysis
│   │   └── User.js                 # User profile, role, 11-digit Student ID & approval status
│   ├── routes/                     # REST API endpoints
│   │   ├── aiExam.js               # Gemini AI exam generator & AI Exam-Question Detector API
│   │   ├── auth.js                 # Authentication & password management routes
│   │   ├── exams.js                # Exam management routes
│   │   ├── notifications.js        # Notification routes
│   │   ├── questionBank.js         # Question bank & AI generator routes
│   │   ├── schedules.js            # Institutional schedule request & approval routes
│   │   ├── submissions.js          # Submission & leaderboard routes
│   │   └── superAdmin.js           # Super admin analytics, student directory & backup routes
│   ├── .env.example                # Environment variables template (no secrets)
│   ├── package.json                # Backend dependencies
│   └── server.js                   # Express application entry point
│
├── frontend/                       # React 18 Web Application
│   ├── public/                     # Public HTML template & icons
│   ├── src/
│   │   ├── api/                    # API integration service
│   │   │   ├── axios.js            # Axios configuration with auth headers
│   │   │   └── index.js            # API methods (authAPI, examAPI, aiExamAPI, superAdminAPI)
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ActiveExamWatermark.js # Machine-readable active exam watermark wrapper
│   │   │   ├── ExaminLogo.js       # Platform logo icon
│   │   │   ├── LoadingSpinner.js   # Global loading animation
│   │   │   └── Navbar.js           # Responsive header navigation & Dark mode toggle
│   │   ├── context/                # Global React State
│   │   │   ├── AuthContext.js      # User auth state & session management
│   │   │   └── ThemeContext.js     # Dark Mode / Light Mode persistent theme
│   │   ├── pages/                  # Route views
│   │   │   ├── AdminDashboard.js   # Instructor control panel & password tool
│   │   │   ├── AdminLogin.js       # Administrative login page with top-right Close (✕)
│   │   │   ├── AIExamDetector.js   # Vision AI Exam-Question Inspector & verification tool
│   │   │   ├── CreateExam.js       # Dual-mode Exam Builder (Manual & Gemini AI Generator)
│   │   │   ├── Dashboard.js        # Role routing handler
│   │   │   ├── ExamAttempt.js      # Instructions, Face Verify, Watermarked Exam Card & Timer
│   │   │   ├── ExamResults.js      # Leaderboard & AI Insights
│   │   │   ├── Home.js             # Landing page, Bento Grid & Glassmorphism Schedule modal
│   │   │   ├── LiveMonitoring.js   # Admin real-time exam attempt proctoring feed & AI alerts
│   │   │   ├── Login.js            # Generic login view
│   │   │   ├── PricingPlans.js     # Pricing plans, checkout modal & invoice download
│   │   │   ├── QuestionBank.js     # Question bank manager, CSV import & AI generator
│   │   │   ├── Register.js         # Student registration form with approved school dropdown
│   │   │   ├── StudentDashboard.js # Student portal, available exams & Change Password modal
│   │   │   ├── StudentLogin.js     # Student login via Student ID with top-right Close (✕)
│   │   │   ├── SuperAdminDashboard.js # Master governance, portals, directory & schedules
│   │   │   └── ViewSubmissions.js # Submission management & deletion table
│   │   ├── utils/                  # Helper utilities
│   │   │   └── helpers.js          # Date formatting, score calculation & grade letters
│   │   ├── App.js                  # React Router navigation tree
│   │   ├── index.css               # Design system & CSS styling
│   │   └── index.js                # Application render entry point
│   └── package.json                # Frontend dependencies
│
├── README.md                       # Comprehensive system documentation
└── render.yaml                     # Render deployment configuration
```

---

## 🚀 Quick Start & Development

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`

---

## ✅ Quality & Build Status

* **Backend API**: Node.js / Express API fully operational with Google Gemini AI & Vision AI Exam-Question Detector.
* **Frontend App**: Production React 18 build verified with zero errors.
