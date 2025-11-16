import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function EmployerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/employers/profile');
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/employers/profile', formData);
      alert('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating profile');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!profile) {
    return <div className="container">Error loading profile</div>;
  }

  return (
    <div className="container">
      <h1>Company Profile</h1>
      
      <div className="card">
        {!editing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Profile Information</h2>
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            </div>
            <p><strong>Company Name:</strong> {profile.company_name}</p>
            <p><strong>Location:</strong> {profile.location}</p>
            <p><strong>Website:</strong> {profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a> : 'Not provided'}</p>
            <p><strong>Contact Person:</strong> {profile.contact_name}</p>
            <p><strong>Contact Email:</strong> {profile.contact_email}</p>
            <p><strong>Contact Phone:</strong> {profile.contact_phone}</p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Edit Profile</h2>
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
                value={formData.website || ''}
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
              <label>Contact Phone *</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button 
              type="button" 
              onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default EmployerProfile;

