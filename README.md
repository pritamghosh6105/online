# Examin - Online Exam System

A full-stack web application for conducting online examinations with role-based access for students and administrators.

## Features

### 🔑 Core Features
- **User Authentication**: Student & Admin registration/login with role-based access
- **Admin Features**: 
  - Create exams (title, duration, subject)
  - Add MCQ questions with multiple options
  - View student submissions and results
- **Student Features**:
  - View available exams
  - Attempt exams with timer functionality
  - Submit exams and view results immediately
- **Auto-Evaluation**: Automatic grading for MCQ questions
- **Results Management**: Students can view their own results, admins can view all results

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **CORS** for cross-origin requests

### Frontend
- **React.js** with hooks
- **React Router** for navigation
- **Axios** for API calls
- **React Toastify** for notifications
- **Lucide React** for icons

## Project Structure

```
examin/
├── backend/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication middleware
│   ├── models/         # Database schemas
│   ├── routes/         # API routes
│   ├── server.js       # Entry point
│   ├── package.json    # Dependencies
│   └── .env           # Environment variables
├── frontend/
│   ├── public/        # Static files
│   ├── src/
│   │   ├── api/       # API service layer
│   │   ├── components/ # Reusable components
│   │   ├── context/   # React context
│   │   ├── pages/     # Page components
│   │   ├── utils/     # Utility functions
│   │   ├── App.js     # Main app component
│   │   └── index.js   # Entry point
│   └── package.json   # Dependencies
└── README.md          # This file
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/examin
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d
   ```

4. **Start the backend server**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

   The backend will be running on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the frontend development server**:
   ```bash
   npm start
   ```

   The frontend will be running on `http://localhost:3000`

### Database Setup

1. **Install MongoDB** locally or use MongoDB Atlas (cloud)
2. **Create a database** named `examin`
3. The application will automatically create the required collections

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Exams (Protected)
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get single exam
- `POST /api/exams` - Create exam (Admin only)
- `PUT /api/exams/:id` - Update exam (Admin only)
- `DELETE /api/exams/:id` - Delete exam (Admin only)

### Submissions (Protected)
- `POST /api/submissions` - Submit exam (Student only)
- `GET /api/submissions/my` - Get my submissions (Student only)
- `GET /api/submissions` - Get all submissions (Admin only)
- `GET /api/submissions/:id` - Get single submission

## User Roles

### Student
- Register/Login
- View available exams
- Attempt exams with timer
- Submit answers
- View own results

### Admin
- Register/Login
- Create and manage exams
- Add MCQ questions
- View all submissions
- View all results

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (student/admin),
  isActive: Boolean,
  timestamps: true
}
```

### Exam Model
```javascript
{
  title: String,
  subject: String,
  duration: Number (minutes),
  totalMarks: Number,
  questions: [QuestionSchema],
  createdBy: ObjectId (User),
  isActive: Boolean,
  startDate: Date,
  endDate: Date,
  timestamps: true
}
```

### Submission Model
```javascript
{
  student: ObjectId (User),
  exam: ObjectId (Exam),
  answers: [AnswerSchema],
  totalScore: Number,
  totalMarks: Number,
  percentage: Number,
  startTime: Date,
  endTime: Date,
  timeTaken: Number,
  timestamps: true
}
```

## Development

### Running in Development Mode

1. **Backend** (with auto-restart):
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend** (with hot reload):
   ```bash
   cd frontend
   npm start
   ```

### Building for Production

1. **Frontend build**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Backend production**:
   ```bash
   cd backend
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

---

**Happy Coding! 🚀**