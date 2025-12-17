import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import StudentLogin from './pages/StudentLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExamAttempt from './pages/ExamAttempt';
import ExamResults from './pages/ExamResults';
import CreateExam from './pages/CreateExam';
import ViewSubmissions from './pages/ViewSubmissions';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={!user ? <StudentLogin /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/student-login" 
            element={!user ? <StudentLogin /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/admin-login" 
            element={!user ? <AdminLogin /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/register" 
            element={!user ? <Register /> : <Navigate to="/dashboard" />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" />} 
          />
          
          {/* Student Routes */}
          <Route 
            path="/student" 
            element={
              user && user.role === 'student' ? 
              <StudentDashboard /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/exam/:id" 
            element={
              user && user.role === 'student' ? 
              <ExamAttempt /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/results" 
            element={
              user && user.role === 'student' ? 
              <ExamResults /> : 
              <Navigate to="/dashboard" />
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' ? 
              <AdminDashboard /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/admin/create-exam" 
            element={
              user && user.role === 'admin' ? 
              <CreateExam /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/admin/submissions" 
            element={
              user && user.role === 'admin' ? 
              <ViewSubmissions /> : 
              <Navigate to="/dashboard" />
            } 
          />
          
          {/* Default Route */}
          <Route 
            path="/" 
            element={
              user ? 
              <Navigate to="/dashboard" /> : 
              <Navigate to="/login" />
            } 
          />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;