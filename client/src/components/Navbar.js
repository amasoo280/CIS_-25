import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '18px', marginRight: '20px' }}>UMD Co-Op Portal</span>
          <Link to="/positions">Browse Positions</Link>
        </div>
        <div>
          {user ? (
            <>
              <Link to={`/${user.role}/dashboard`}>Dashboard</Link>
              {user.role === 'student' && <Link to="/student/profile">Profile</Link>}
              {user.role === 'employer' && <Link to="/employer/profile">Profile</Link>}
              {user.role === 'faculty' && <Link to="/faculty/profile">Profile</Link>}
              <span style={{ marginLeft: '20px' }}>
                Welcome, {user.full_name || user.contact_name || user.email}
                {user.role === 'faculty' && <span style={{ color: '#aaa', fontSize: '12px' }}> (Coordinator)</span>}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '20px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register/student">Register as Student</Link>
              <Link to="/register/employer">Register as Employer</Link>
              <Link to="/register/faculty">Register as Faculty</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;