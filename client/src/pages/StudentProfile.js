import React, { useState, useEffect } from 'react';
import api from '../utils/api';

// Server base URL for file uploads
const SERVER_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setError(null);
    try {
      const response = await api.get('/students/profile');
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setError('Error loading profile. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/students/profile', formData);
      alert('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating profile');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('resume', file);

    try {
      const response = await api.post('/upload/resume', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update resume path in profile
      await api.put('/students/resume', { resume_path: response.data.file_path });
      alert('Resume uploaded successfully!');
      fetchProfile();
    } catch (error) {
      alert(error.response?.data?.error || 'Error uploading resume');
    }
  };

  // Helper function to get full resume URL
  const getResumeUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SERVER_URL}${path}`;
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
          <p style={{ margin: 0, color: '#856404' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="container">Error loading profile. Please try logging in again.</div>;
  }

  return (
    <div className="container">
      <h1>My Profile</h1>
      
      <div className="card">
        {!editing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Profile Information</h2>
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', marginBottom: '15px' }}>Personal Info</h3>
                <p><strong>Name:</strong> {profile.full_name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
              </div>
              <div>
                <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '5px', marginBottom: '15px' }}>Academic Info</h3>
                <p><strong>Department:</strong> {profile.department}</p>
                <p><strong>Major:</strong> {profile.major}</p>
                <p><strong>Credit Hours:</strong> {profile.credit_hours}</p>
                <p><strong>GPA:</strong> {profile.gpa}</p>
                <p><strong>Semester Started:</strong> {profile.semester_started}</p>
                <p><strong>Transfer Student:</strong> {profile.is_transfer ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h3>Resume</h3>
              {profile.resume_path ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <a 
                    href={getResumeUrl(profile.resume_path)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                  >
                    View Current Resume
                  </a>
                  <span style={{ color: '#666' }}>or</span>
                  <label className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Upload New Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#666', marginBottom: '10px' }}>No resume uploaded yet.</p>
                  <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    Upload Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Edit Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
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
                <label>Credit Hours *</label>
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
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_transfer"
                    checked={formData.is_transfer === 1 || formData.is_transfer === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_transfer: e.target.checked ? 1 : 0 }))}
                    style={{ marginRight: '10px', width: 'auto' }}
                  />
                  Transfer Student
                </label>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
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
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;