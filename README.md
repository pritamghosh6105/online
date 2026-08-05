# Examin - Online Examination System 🎓

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=for-the-badge&logo=react)
![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb)

Comprehensive documentation for the **Examin** platform, detailing system architecture, user workflows, proctoring security, database models, API specifications, and deployment guidelines.

---

## 📌 Project Overview

**Examin** is an enterprise-grade full-stack web application designed for educational institutions, schools, and corporate certifiers to conduct secure online examinations. It features **real-time AI proctoring**, **AI-assisted question generation**, **automated MCQ grading**, **leaderboard rankings**, **QR-verified certificate issuance**, **live proctor monitoring**, and **super admin platform oversight**.

---

## ✨ Features & Capabilities

* 🛡️ **Proctoring & Anti-Cheating Suite**: Tab-switching detection counter, copy/paste text protection, webcam face verification, and live candidate proctoring feed (`/admin/live-monitoring`).
* 🤖 **AI Question Generator**: Generate topic-based multiple choice questions automatically with explanations and custom difficulty levels.
* 📚 **Question Bank**: Centralized bank with category tags, difficulty filter (Easy, Medium, Hard), and bulk CSV/JSON import capabilities.
* 🏆 **Leaderboards & AI Insights**: Instant score evaluation, class rank calculation (1st, 2nd, 3rd place), and AI-generated performance feedback breaking down strengths and weakness recommendations.
* 📜 **Printable QR Certificates**: Automatic PDF/Printable certificate generation for passing candidates, complete with scannable QR verification link (`/verify-certificate/:certId`).
* 📊 **Super Admin Command Center**: Live platform analytics (total users, exams, pass rate %, active subscriptions), system audit logs, and one-click database JSON backup export.
* 💳 **Plans & Subscriptions**: Flexible pricing plans view (`/pricing`), card payment simulation, and invoice downloader.
* 🌓 **Dark Mode / Light Mode**: Persistent theme toggle across all dashboard views.

---

## 🔒 Security & Compliance

* **JWT Authentication**: Secure JSON Web Tokens stored with session management.
* **Role-Based Access Control (RBAC)**: Strict role separation between Students, Admins/Instructors, and Super Admin.
* **Proctoring Audit Trail**: Every tab switch, copy attempt, and proctor flag recorded in submission records.
* **Database Encryption & Hashing**: Bcrypt password hashing (12 rounds) and sanitized inputs via express-validator.

---

## 🚀 Complete 10-Step Workflow

1. **Institution Onboarding**: Demo Request -> Super Admin Approval -> Admin Credentials Email.
2. **Student Exam Workflow**: Pre-exam Instructions -> Face Verification -> Timed Exam with 30s Auto-Save -> Auto-Submit -> QR Certificate.
3. **Admin Exam Creation**: Create Subject -> Select Question Bank / AI Generator -> Set Duration -> Schedule & Publish.
4. **Result & Analytics**: Auto Evaluation -> Rank Generation -> AI Strengths & Weakness Analysis.
5. **Question Bank**: Categories -> CSV Import -> Difficulty Filters -> Random Question Selection.
6. **Proctoring Workflow**: Camera Permission -> Face Detection -> Tab Switch Counter -> Copy/Paste Block.
7. **Notification Workflow**: In-App Dashboard Alerts & Email notifications.
8. **Super Admin Workflow**: Manage Institutions -> Approve Admins -> Platform Analytics -> Audit Logs -> JSON Backup.
9. **Certificate Workflow**: Pass Exam -> Printable PDF Certificate -> QR Verification Code.
10. **Payment Workflow**: Select Plan -> Simulated Payment Gateway -> Subscription Activation -> Download Invoice.

---

## 📂 Project Directory & File Structure

```
examin/
├── backend/                        # Node.js / Express Server
│   ├── controllers/                # Request handling logic
│   │   ├── authController.js       # Registration, login, credential change & approvals
│   │   ├── certificateController.js# Certificate generation & QR verification
│   │   ├── examController.js       # Exam creation, editing, deletion & retrieval
│   │   ├── questionBankController.js# Question bank CRUD, CSV import & AI generation
│   │   ├── submissionController.js # Auto-evaluation, rank calculation & AI analysis
│   │   └── superAdminController.js # Platform analytics, audit logs & database backup
│   ├── middleware/                 # Route guards & security
│   │   └── auth.js                 # JWT token verification & role authorization
│   ├── models/                     # Mongoose database schemas
│   │   ├── AuditLog.js             # System action audit trail
│   │   ├── Certificate.js          # Issued certificate & verification hash
│   │   ├── Exam.js                 # Exam structure, proctoring & passing marks
│   │   ├── Institution.js          # Institutional subscription plan & limits
│   │   ├── Notification.js         # User dashboard notification alerts
│   │   ├── QuestionBank.js         # Question bank categories, difficulty & options
│   │   ├── Schedule.js             # Institutional demo schedule requests
│   │   ├── Submission.js           # Student test results, proctor logs & AI analysis
│   │   └── User.js                 # User profile, role & approval status
│   ├── routes/                     # REST API endpoints
│   │   ├── auth.js                 # Authentication routes
│   │   ├── certificates.js         # Certificate & verification routes
│   │   ├── exams.js                # Exam management routes
│   │   ├── notifications.js        # Notification routes
│   │   ├── questionBank.js         # Question bank & AI generator routes
│   │   ├── schedules.js            # Institutional schedule request routes
│   │   ├── submissions.js          # Submission & leaderboard routes
│   │   └── superAdmin.js           # Super admin analytics & backup routes
│   ├── package.json                # Backend dependencies
│   └── server.js                   # Express application entry point
│
├── frontend/                       # React 18 Web Application
│   ├── public/                     # Public HTML template & icons
│   ├── src/
│   │   ├── api/                    # API integration service
│   │   │   └── index.js            # Axios client with interceptors
│   │   ├── components/             # Reusable UI components
│   │   │   ├── CertificateModal.js # PDF / Canvas Printable Certificate with QR Code
│   │   │   ├── ExaminLogo.js       # Platform logo icon
│   │   │   ├── LoadingSpinner.js   # Global loading animation
│   │   │   └── Navbar.js           # Responsive header navigation & Dark mode toggle
│   │   ├── context/                # Global React State
│   │   │   ├── AuthContext.js      # User auth state & session management
│   │   │   └── ThemeContext.js     # Dark Mode / Light Mode persistent theme
│   │   ├── pages/                  # Route views
│   │   │   ├── AdminDashboard.js   # Instructor/Admin control panel
│   │   │   ├── AdminLogin.js       # Administrative login page
│   │   │   ├── CertificateVerify.js# Public QR Code Certificate verification portal
│   │   │   ├── CreateExam.js       # Exam builder with MCQ management
│   │   │   ├── Dashboard.js        # Role router page
│   │   │   ├── ExamAttempt.js      # Instructions, Face Verify & Live Exam with proctoring
│   │   │   ├── ExamResults.js      # Leaderboard, AI Insights & Certificate download
│   │   │   ├── Home.js             # Landing page & demo request form
│   │   │   ├── LiveMonitoring.js   # Admin real-time exam attempt proctoring feed
│   │   │   ├── Login.js            # Generic login view
│   │   │   ├── PricingPlans.js     # Pricing plans, checkout modal & invoice download
│   │   │   ├── QuestionBank.js     # Question bank manager, CSV import & AI generator
│   │   │   ├── Register.js         # Student registration form
│   │   │   ├── StudentDashboard.js # Student portal & available exams
│   │   │   ├── StudentLogin.js     # Student login via ID
│   │   │   ├── SuperAdminDashboard.js # Master system administration & analytics
│   │   │   └── ViewSubmissions.js # Submission management & deletion table
│   │   ├── App.js                  # React Router navigation tree
│   │   ├── index.css               # Design system & CSS styling
│   │   └── index.js                # Application render entry point
│   └── package.json                # Frontend dependencies
│
├── EXAMIN_SUMMARY.md               # Complete system documentation
└── render.yaml                     # Render deployment configuration
```

---

## 👥 User Roles & Architecture

```mermaid
flowchart TD
    User([User Registration / Login]) --> RoleCheck{Role Check}
    RoleCheck -->|Student| StudentDash[Student Dashboard]
    RoleCheck -->|Admin / Instructor| AdminDash[Admin Dashboard]
    RoleCheck -->|Super Admin| SuperAdminDash[Super Admin Dashboard]

    StudentDash --> PreCheck[Instructions & Face Verification]
    PreCheck --> Attempt[Attempt Active Proctored Exam]
    Attempt --> AutoGrade[Auto-Evaluation Engine]
    AutoGrade --> Results[View Leaderboard, AI Insights & QR Certificate]

    AdminDash --> QBank[Question Bank & AI Generator]
    AdminDash --> Create[Create & Schedule Exams]
    AdminDash --> LiveMonitor[Live Proctoring Feed]
    AdminDash --> ViewSub[View & Manage Student Submissions]

    SuperAdminDash --> Analytics[Platform Analytics & Audit Logs]
    SuperAdminDash --> Approve[Approve Pending Institutional Admins]
    SuperAdminDash --> Onboard[Manage Demo Requests & Subscriptions]
    SuperAdminDash --> Backup[Export Database Backup JSON]
```

---

## 🗄️ Database Schemas

### QuestionBank Schema (`models/QuestionBank.js`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `question` | String | MCQ question text |
| `category` | String | Topic category (e.g. Mathematics, CS) |
| `difficulty` | String | Enum: `Easy`, `Medium`, `Hard` |
| `options` | Array | Options text & boolean `isCorrect` |
| `marks` | Number | Weightage marks |

### Certificate Schema (`models/Certificate.js`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `certificateId` | String | Unique hash ID (e.g. `CERT-A1B2C3D4`) |
| `studentName` | String | Passed candidate full name |
| `examTitle` | String | Exam title |
| `score` | Number | Total score achieved |
| `percentage` | Number | Calculated percentage |
| `issueDate` | Date | Issuance date |

---

## ⚡ Key API Endpoints

### Question Bank (`/api/question-bank`)
* `GET /api/question-bank` — List and filter questions by category/difficulty
* `POST /api/question-bank` — Add new question
* `POST /api/question-bank/import` — Bulk import questions via JSON/CSV
* `POST /api/question-bank/ai-generate` — Generate AI questions by topic prompt

### Certificates (`/api/certificates`)
* `GET /api/certificates/submission/:submissionId` — Generate/fetch certificate
* `GET /api/certificates/verify/:certId` — Public verification of QR certificate ID

### Super Admin (`/api/superadmin`)
* `GET /api/superadmin/analytics` — Platform usage stats & pass rate
* `GET /api/superadmin/audit-logs` — Administrative audit action logs
* `GET /api/superadmin/backup` — Export full platform JSON snapshot

---

## 🛠️ Quick Start & Development

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

* **Backend**: Node.js / Express API fully operational with clean routes.
* **Frontend**: Production build verified with **0 warnings and 0 errors**.

---

### 🔮 More Features Coming Soon
* 📱 Native Mobile App Integration (React Native / Android SDK)
* 🌐 Multi-language Exam Translations
* ⚡ Automated Essay / Subjective AI Grading
