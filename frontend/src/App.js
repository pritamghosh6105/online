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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import Home from './pages/Home';

// Check if user is admin or superadmin
const isAdmin = (u) => u && (u.role === 'admin' || u.role === 'superadmin' || u.email === 'admin@examin.com');

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
          {/* Public Landing Home Route */}
          <Route 
            path="/" 
            element={!user ? <Home /> : <Navigate to="/dashboard" />} 
          />

          {/* Public Auth Routes */}
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

          {/* Super Admin Route */}
          <Route 
            path="/super-admin" 
            element={
              user && (user.role === 'superadmin' || user.email === 'admin@examin.com') ? 
              <SuperAdminDashboard /> : 
              <Navigate to="/dashboard" />
            } 
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
              isAdmin(user) ? 
              <AdminDashboard /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/admin/create-exam" 
            element={
              isAdmin(user) ? 
              <CreateExam /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/admin/submissions" 
            element={
              isAdmin(user) ? 
              <ViewSubmissions /> : 
              <Navigate to="/dashboard" />
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