import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and user info
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const { token, user: userData } = response.data;
      
      // Include the role in the user object
      const userWithRole = { ...userData, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      setUser(userWithRole);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (data, role) => {
    try {
      let endpoint;
      switch (role) {
        case 'student':
          endpoint = '/auth/register/student';
          break;
        case 'employer':
          endpoint = '/auth/register/employer';
          break;
        case 'faculty':
          endpoint = '/auth/register/faculty';
          break;
        default:
          return { success: false, error: 'Invalid role' };
      }
      
      const response = await api.post(endpoint, data);
      const { token, user: userData } = response.data;
      
      // Include the role in the user object
      const userWithRole = { ...userData, role };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithRole));
      setUser(userWithRole);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};