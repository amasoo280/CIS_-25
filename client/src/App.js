import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterEmployer from './pages/RegisterEmployer';
import StudentDashboard from './pages/StudentDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import PositionSearch from './pages/PositionSearch';
import PositionDetail from './pages/PositionDetail';
import StudentProfile from './pages/StudentProfile';
import EmployerProfile from './pages/EmployerProfile';
import './App.css';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="container">Access denied. You don't have permission to view this page.</div>;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/register/employer" element={<RegisterEmployer />} />
      
      <Route path="/positions" element={<PositionSearch />} />
      <Route path="/positions/:id" element={<PositionDetail />} />
      
      <Route 
        path="/student/dashboard" 
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/profile" 
        element={
          <PrivateRoute allowedRoles={['student']}>
            <StudentProfile />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/employer/dashboard" 
        element={
          <PrivateRoute allowedRoles={['employer']}>
            <EmployerDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/employer/profile" 
        element={
          <PrivateRoute allowedRoles={['employer']}>
            <EmployerProfile />
          </PrivateRoute>
        } 
      />
      
      <Route 
        path="/faculty/dashboard" 
        element={
          <PrivateRoute allowedRoles={['faculty']}>
            <FacultyDashboard />
          </PrivateRoute>
        } 
      />
      
      <Route path="/" element={<Navigate to="/positions" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

