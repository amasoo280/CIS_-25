import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterEmployer() {
  const [formData, setFormData] = useState({
    company_name: '',
    location: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    const result = await register(dataToSend, 'employer');
    
    if (result.success) {
      navigate('/employer/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '50px auto' }}>
        <h2>Employer Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Contact Person Name *</label>
            <input
              type="text"
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Email *</label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Contact Phone *</label>
            <input
              type="tel"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              required
            />
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

export default RegisterEmployer;

