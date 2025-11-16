import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function EmployerDashboard() {
  const [positions, setPositions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await api.get('/positions/employer/my-positions');
      setPositions(response.data || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      // Set empty array on error to prevent blank page
      setPositions([]);
      if (error.response?.status !== 401) {
        alert('Error loading positions. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Employer Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel' : 'Create New Position'}
        </button>
      </div>

      {showCreateForm && (
        <CreatePositionForm onSuccess={() => {
          setShowCreateForm(false);
          fetchPositions();
        }} />
      )}

      <div className="card">
        <h2>My Positions</h2>
        {positions.length === 0 ? (
          <p>You haven't created any positions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Weeks</th>
                <th>Hours/Week</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(position => (
                <tr key={position.position_id}>
                  <td>{position.job_title}</td>
                  <td>{position.status}</td>
                  <td>{position.number_of_weeks}</td>
                  <td>{position.hours_per_week}</td>
                  <td>{position.job_location}</td>
                  <td>
                    <PositionActions position={position} onUpdate={fetchPositions} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CreatePositionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    job_title: '',
    job_description: '',
    number_of_weeks: '',
    hours_per_week: '',
    job_location: '',
    majors_of_interest: '',
    required_skills: '',
    preferred_skills: '',
    salary_info: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/positions', formData);
      alert('Position created successfully!');
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Error creating position');
    }
  };

  return (
    <div className="card">
      <h2>Create New Position</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Job Title *</label>
          <input
            type="text"
            name="job_title"
            value={formData.job_title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Job Description *</label>
          <textarea
            name="job_description"
            value={formData.job_description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Number of Weeks *</label>
          <input
            type="number"
            name="number_of_weeks"
            value={formData.number_of_weeks}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Hours per Week *</label>
          <input
            type="number"
            name="hours_per_week"
            value={formData.hours_per_week}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Job Location *</label>
          <input
            type="text"
            name="job_location"
            value={formData.job_location}
            onChange={handleChange}
            placeholder="e.g., San Francisco, CA or Remote"
            required
          />
        </div>
        <div className="form-group">
          <label>Majors of Interest *</label>
          <input
            type="text"
            name="majors_of_interest"
            value={formData.majors_of_interest}
            onChange={handleChange}
            placeholder="e.g., Computer Science, Software Engineering"
            required
          />
        </div>
        <div className="form-group">
          <label>Required Skills</label>
          <input
            type="text"
            name="required_skills"
            value={formData.required_skills}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Preferred Skills</label>
          <input
            type="text"
            name="preferred_skills"
            value={formData.preferred_skills}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Salary Information</label>
          <input
            type="text"
            name="salary_info"
            value={formData.salary_info}
            onChange={handleChange}
            placeholder="e.g., $20-25/hour"
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn btn-primary">Create Position</button>
      </form>
    </div>
  );
}

function PositionActions({ position, onUpdate }) {
  const [showApplicants, setShowApplicants] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications/position/${position.position_id}`);
      setApplicants(response.data);
      setShowApplicants(true);
    } catch (error) {
      alert('Error fetching applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (studentId) => {
    setShowApplicants(false);
    setLoading(true);
    try {
      await api.post(`/positions/${position.position_id}/select-student`, {
        student_id: studentId
      });
      alert('Student selected successfully! Eligibility check completed.');
      onUpdate();
    } catch (error) {
      alert(error.response?.data?.error || 'Error selecting student');
    } finally {
      setLoading(false);
    }
  };


  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/positions/${position.position_id}`, {
        ...position,
        status: newStatus
      });
      onUpdate();
    } catch (error) {
      alert('Error updating status');
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <button 
        onClick={fetchApplicants}
        className="btn btn-secondary"
        disabled={loading}
        style={{ marginRight: '5px' }}
      >
        View Applicants
      </button>
      {position.status === 'pending' && (
        <button 
          onClick={() => handleStatusChange('closed')}
          className="btn btn-secondary"
        >
          Close Position
        </button>
      )}
      {showApplicants && (
        <SelectStudentModal
          applicants={applicants}
          onSelect={handleSelectStudent}
          onClose={() => {
            setShowApplicants(false);
          }}
          showSelectButton={position.status === 'open'}
        />
      )}
    </div>
  );
}

function SelectStudentModal({ applicants, onSelect, onClose, showSelectButton = true }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
        <h2>Applicants for This Position</h2>
        {applicants.length === 0 ? (
          <p>No applicants for this position.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Major</th>
                <th>GPA</th>
                <th>Credit Hours</th>
                <th>Status</th>
                <th>Resume</th>
                {showSelectButton && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {applicants.map(applicant => (
                <tr key={applicant.application_id}>
                  <td>{applicant.full_name}</td>
                  <td>{applicant.email}</td>
                  <td>{applicant.major}</td>
                  <td>{applicant.gpa}</td>
                  <td>{applicant.credit_hours}</td>
                  <td>{applicant.status}</td>
                  <td>
                    {applicant.resume_path ? (
                      <a href={applicant.resume_path} target="_blank" rel="noopener noreferrer">
                        View Resume
                      </a>
                    ) : (
                      'No resume'
                    )}
                  </td>
                  {showSelectButton && (
                    <td>
                      <button 
                        onClick={() => onSelect(applicant.student_id)}
                        className="btn btn-success"
                      >
                        Select
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '20px' }}>
          Close
        </button>
      </div>
    </div>
  );
}

export default EmployerDashboard;

