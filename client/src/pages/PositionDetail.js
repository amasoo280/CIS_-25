import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function PositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchPosition();
    if (user && user.role === 'student') {
      checkApplicationStatus();
    }
  }, [id, user]);

  const fetchPosition = async () => {
    try {
      const response = await api.get(`/positions/${id}`);
      setPosition(response.data);
    } catch (error) {
      console.error('Error fetching position:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await api.get('/applications/my-applications');
      const hasApplied = response.data.some(app => app.position_id === parseInt(id));
      setApplied(hasApplied);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/applications', { position_id: parseInt(id) });
      alert('Application submitted successfully!');
      setApplied(true);
    } catch (error) {
      alert(error.response?.data?.error || 'Error submitting application');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!position) {
    return <div className="container">Position not found</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>{position.job_title}</h1>
        <p><strong>Company:</strong> {position.company_name}</p>
        <p><strong>Location:</strong> {position.job_location}</p>
        <p><strong>Status:</strong> {position.status}</p>
        
        <h2>Position Details</h2>
        <p><strong>Duration:</strong> {position.number_of_weeks} weeks</p>
        <p><strong>Hours per Week:</strong> {position.hours_per_week}</p>
        <p><strong>Total Hours:</strong> {position.number_of_weeks * position.hours_per_week}</p>
        
        <h3>Description</h3>
        <p>{position.job_description}</p>
        
        <h3>Majors of Interest</h3>
        <p>{position.majors_of_interest}</p>
        
        {position.required_skills && (
          <>
            <h3>Required Skills</h3>
            <p>{position.required_skills}</p>
          </>
        )}
        
        {position.preferred_skills && (
          <>
            <h3>Preferred Skills</h3>
            <p>{position.preferred_skills}</p>
          </>
        )}
        
        {position.salary_info && (
          <>
            <h3>Salary Information</h3>
            <p>{position.salary_info}</p>
          </>
        )}

        <h3>Contact Information</h3>
        <p><strong>Contact Person:</strong> {position.contact_name}</p>
        <p><strong>Email:</strong> {position.contact_email}</p>
        <p><strong>Phone:</strong> {position.contact_phone}</p>
        {position.website && (
          <p><strong>Website:</strong> <a href={position.website} target="_blank" rel="noopener noreferrer">{position.website}</a></p>
        )}

        {user && user.role === 'student' && position.status === 'open' && (
          <div style={{ marginTop: '20px' }}>
            {applied ? (
              <p style={{ color: 'green' }}>You have already applied to this position.</p>
            ) : (
              <button onClick={handleApply} className="btn btn-primary">
                Apply Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PositionDetail;

