import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterStudent() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    major: '',
    credit_hours: '',
    gpa: '',
    semester_started: '',
    is_transfer: false,
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword, ...dataToSend } = formData;
    const result = await register(dataToSend, 'student');
    
    if (result.success) {
      navigate('/student/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
        <h2>Student Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Department *</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Major *</label>
            <input
              type="text"
              name="major"
              value={formData.major}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Credit Hours Completed *</label>
            <input
              type="number"
              name="credit_hours"
              value={formData.credit_hours}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>GPA *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              name="gpa"
              value={formData.gpa}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Semester Started *</label>
            <input
              type="text"
              name="semester_started"
              value={formData.semester_started}
              onChange={handleChange}
              placeholder="e.g., Fall 2023"
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="is_transfer"
                checked={formData.is_transfer}
                onChange={handleChange}
              />
              Transfer Student
            </label>
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterStudent;

