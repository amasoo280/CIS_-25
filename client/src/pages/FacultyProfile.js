import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function FacultyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/faculty/profile');
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
      await api.put('/faculty/profile', formData);
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
      <h1>Faculty Profile</h1>
      
      <div className="card">
        {!editing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Profile Information</h2>
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            </div>
            <p><strong>Full Name:</strong> {profile.full_name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Department:</strong> {profile.department}</p>
            <p style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>Role:</strong> Co-op Coordinator for {profile.department} Department
            </p>
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
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
              <small style={{ color: '#666' }}>Email cannot be changed.</small>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
              <small style={{ color: '#666' }}>Department cannot be changed. Contact admin if needed.</small>
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

      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Coordinator Statistics</h2>
        <CoordinatorStats />
      </div>
    </div>
  );
}

function CoordinatorStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/faculty/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading statistics...</p>;
  }

  if (!stats) {
    return <p>Unable to load statistics.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ margin: '0', color: '#007bff' }}>{stats.total_coop_students || 0}</h3>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Co-op Students</p>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ margin: '0', color: '#28a745' }}>{stats.graded || 0}</h3>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Graded</p>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ margin: '0', color: '#ffc107' }}>{stats.pending_grade || 0}</h3>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Pending Grade</p>
      </div>
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ margin: '0', color: '#17a2b8' }}>{stats.summaries_submitted || 0}</h3>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>Summaries Submitted</p>
      </div>
    </div>
  );
}

export default FacultyProfile;