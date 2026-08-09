import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded page components for Code-Splitting & fast initial load
const Home = lazy(() => import('./pages/Home'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const ExamAttempt = lazy(() => import('./pages/ExamAttempt'));
const ExamResults = lazy(() => import('./pages/ExamResults'));
const CreateExam = lazy(() => import('./pages/CreateExam'));
const ViewSubmissions = lazy(() => import('./pages/ViewSubmissions'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const StudentQuestionBank = lazy(() => import('./pages/StudentQuestionBank'));
const LiveMonitoring = lazy(() => import('./pages/LiveMonitoring'));
const CertificateVerify = lazy(() => import('./pages/CertificateVerify'));

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
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public Landing Home Route */}
          <Route 
            path="/" 
            element={!user ? <Home /> : <Navigate to="/dashboard" />} 
          />

          {/* Public Certificate Verification */}
          <Route path="/verify-certificate/:certId" element={<CertificateVerify />} />

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
              user ? (
                user.role === 'student' ? <StudentDashboard /> : <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/student-login" />
              )
            } 
          />
          <Route 
            path="/student/dashboard" 
            element={
              user ? (
                user.role === 'student' ? <StudentDashboard /> : <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/student-login" />
              )
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
          <Route 
            path="/question-bank" 
            element={
              user ? (
                user.role === 'student' ? <StudentQuestionBank /> : <QuestionBank />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              user ? (
                isAdmin(user) ? <AdminDashboard /> : <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/admin-login" />
              )
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              user ? (
                isAdmin(user) ? <AdminDashboard /> : <Navigate to="/dashboard" />
              ) : (
                <Navigate to="/admin-login" />
              )
            } 
          />
          <Route 
            path="/admin/question-bank" 
            element={
              isAdmin(user) ? 
              <QuestionBank /> : 
              <Navigate to="/dashboard" />
            } 
          />
          <Route 
            path="/admin/live-monitoring" 
            element={
              isAdmin(user) ? 
              <LiveMonitoring /> : 
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
        </Suspense>
      </main>
    </div>
  );
}

export default App;