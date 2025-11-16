import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/students/profile');
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
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

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/upload/resume', formData, {
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

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!profile) {
    return <div className="container">Error loading profile</div>;
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
            <p><strong>Name:</strong> {profile.full_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p><strong>Major:</strong> {profile.major}</p>
            <p><strong>Credit Hours:</strong> {profile.credit_hours}</p>
            <p><strong>GPA:</strong> {profile.gpa}</p>
            <p><strong>Semester Started:</strong> {profile.semester_started}</p>
            <p><strong>Transfer Student:</strong> {profile.is_transfer ? 'Yes' : 'No'}</p>
            <p><strong>Resume:</strong> {
              profile.resume_path ? (
                <a href={profile.resume_path} target="_blank" rel="noopener noreferrer">View Resume</a>
              ) : (
                'No resume uploaded'
              )
            }</p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Edit Profile</h2>
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
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_transfer"
                  checked={formData.is_transfer === 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_transfer: e.target.checked ? 1 : 0 }))}
                />
                Transfer Student
              </label>
            </div>
            <div className="form-group">
              <label>Upload Resume</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
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

export default StudentProfile;

