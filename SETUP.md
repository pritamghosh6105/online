# Examin Setup Instructions

## Quick Start Guide

### 1. Prerequisites
Make sure you have the following installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Install locally](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)

### 2. Database Setup
**Option A: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. The application will automatically create the database

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `.env` file in the backend folder

### 3. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Dependencies are already installed
# Start the development server
npm run dev
```

The backend will start on `http://localhost:5000`

### 4. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Dependencies are already installed
# Start the development server
npm start
```

The frontend will start on `http://localhost:3000`

### 5. Environment Configuration
Update `backend/.env` file with your settings:

```env
NODE_ENV=development
PORT=5000

# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/examin

# For MongoDB Atlas, replace with your connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examin

JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d
```

### 6. Test the Application

1. **Register an Admin Account**:
   - Go to `http://localhost:3000/register`
   - Create an account with role "Admin"

2. **Register a Student Account**:
   - Create another account with role "Student"

3. **Create an Exam** (as Admin):
   - Login with admin account
   - Create a new exam with MCQ questions

4. **Attempt Exam** (as Student):
   - Login with student account
   - Attempt the exam created by admin

## Project Structure
```
examin/
├── backend/           # Node.js/Express backend
├── frontend/          # React frontend  
├── README.md         # Main documentation
├── SETUP.md          # This file
└── .gitignore        # Git ignore rules
```

## Available Scripts

### Backend (`cd backend`)
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-restart

### Frontend (`cd frontend`)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**:
   - Make sure MongoDB is running
   - Check your connection string in `.env`

2. **Port Already in Use**:
   - Change the PORT in backend `.env` file
   - Make sure no other processes are using ports 3000 or 5000

3. **CORS Issues**:
   - The backend is configured to accept requests from the frontend
   - Make sure both servers are running

### Getting Help:
- Check the main `README.md` for detailed documentation
- Review the API endpoints and database models
- Ensure all dependencies are properly installed

## Next Steps

After setup, you can:
1. Explore the codebase
2. Add more features
3. Customize the UI
4. Deploy to production

Happy coding! 🚀