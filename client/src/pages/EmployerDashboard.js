import React, { useState, useEffect } from 'react';
import api from '../utils/api';

// Server base URL for file uploads
const SERVER_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

// Helper function to get full file URL
const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
};

function EmployerDashboard() {
  const [positions, setPositions] = useState([]);
  const [coopStudents, setCoopStudents] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const positionsRes = await api.get('/positions/employer/my-positions');
      setPositions(positionsRes.data || []);
      
      // Try to fetch co-op students
      try {
        const coopRes = await api.get('/employers/coop-students');
        setCoopStudents(coopRes.data || []);
      } catch (e) {
        console.log('No co-op students or endpoint not available');
        setCoopStudents([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setPositions([]);
      setCoopStudents([]);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        alert('Error loading data. Please refresh the page.');
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
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('positions')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'positions' ? '#007bff' : 'transparent',
            color: activeTab === 'positions' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            marginRight: '5px'
          }}
        >
          My Positions ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab('coops')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'coops' ? '#007bff' : 'transparent',
            color: activeTab === 'coops' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Co-op Students ({coopStudents.length})
        </button>
      </div>

      {activeTab === 'positions' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingPosition(null);
              }}
              className="btn btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Create New Position'}
            </button>
          </div>

          {showCreateForm && (
            <PositionForm 
              onSuccess={() => {
                setShowCreateForm(false);
                fetchData();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {editingPosition && (
            <PositionForm 
              position={editingPosition}
              onSuccess={() => {
                setEditingPosition(null);
                fetchData();
              }}
              onCancel={() => setEditingPosition(null)}
              isEditing={true}
            />
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
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: position.status === 'open' ? '#d4edda' : position.status === 'pending' ? '#fff3cd' : '#f8d7da',
                          color: position.status === 'open' ? '#155724' : position.status === 'pending' ? '#856404' : '#721c24'
                        }}>
                          {position.status}
                        </span>
                      </td>
                      <td>{position.number_of_weeks}</td>
                      <td>{position.hours_per_week}</td>
                      <td>{position.job_location}</td>
                      <td>
                        <PositionActions 
                          position={position} 
                          onUpdate={fetchData}
                          onEdit={() => {
                            setEditingPosition(position);
                            setShowCreateForm(false);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'coops' && (
        <div className="card">
          <h2>Co-op Students</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            View students who opted for co-op credit and provide feedback on their summaries.
          </p>
          {coopStudents.length === 0 ? (
            <p>No co-op students for your positions yet.</p>
          ) : (
            <div>
              {coopStudents.map(student => (
                <CoopStudentCard key={student.enrollment_id} student={student} onUpdate={fetchData} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoopStudentCard({ student, onUpdate }) {
  const [showDetails, setShowDetails] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/employers/coop-students/${student.enrollment_id}/comment`, {
        comment_text: comment.trim()
      });
      alert('Comment submitted successfully!');
      setComment('');
      onUpdate();
    } catch (error) {
      console.error('Comment error:', error);
      alert(error.response?.data?.error || 'Error submitting comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '15px', border: '1px solid #e0e0e0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>{student.full_name}</h3>
          <p style={{ margin: '0', color: '#666' }}>
            {student.job_title} • {student.major}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {student.coop_summary ? (
            <span style={{ color: 'green' }}>✓ Summary Submitted</span>
          ) : (
            <span style={{ color: '#999' }}>Awaiting Summary</span>
          )}
          <br />
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-secondary"
            style={{ marginTop: '5px', padding: '5px 10px', fontSize: '14px' }}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <p><strong>Email:</strong> {student.email}</p>
              <p><strong>GPA:</strong> {student.gpa}</p>
              <p><strong>Duration:</strong> {student.number_of_weeks} weeks, {student.hours_per_week} hrs/week</p>
            </div>
            <div>
              <p><strong>Eligibility:</strong> {student.eligibility_result}</p>
              <p><strong>Grade:</strong> {student.grade || 'Not yet graded'}</p>
            </div>
          </div>

          {student.coop_summary && (
            <div style={{ marginTop: '15px' }}>
              <h4>Student's Co-op Summary</h4>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '4px',
                border: '1px solid #e9ecef'
              }}>
                {student.coop_summary}
              </div>
            </div>
          )}

          {/* Comments section */}
          <div style={{ marginTop: '15px' }}>
            <h4>Leave Feedback for Faculty</h4>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Your feedback will help the faculty coordinator evaluate this student's performance.
            </p>
            
            {/* Existing comments */}
            {student.comments && student.comments.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Your Previous Comments:</p>
                {student.comments.map((c, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    backgroundColor: '#fff8e1',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    border: '1px solid #ffe082'
                  }}>
                    <p style={{ margin: '0 0 5px 0' }}>{c.comment_text}</p>
                    <small style={{ color: '#666' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your feedback about this student's performance..."
                style={{ 
                  flex: 1, 
                  minHeight: '80px', 
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
              <button
                onClick={handleCommentSubmit}
                className="btn btn-primary"
                disabled={submitting || !comment.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PositionForm({ position, onSuccess, onCancel, isEditing = false }) {
  const [formData, setFormData] = useState({
    job_title: position?.job_title || '',
    job_description: position?.job_description || '',
    number_of_weeks: position?.number_of_weeks || '',
    hours_per_week: position?.hours_per_week || '',
    job_location: position?.job_location || '',
    majors_of_interest: position?.majors_of_interest || '',
    required_skills: position?.required_skills || '',
    preferred_skills: position?.preferred_skills || '',
    salary_info: position?.salary_info || '',
    status: position?.status || 'open'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditing) {
        await api.put(`/positions/${position.position_id}`, formData);
        alert('Position updated successfully!');
      } else {
        await api.post('/positions', formData);
        alert('Position created successfully!');
      }
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || `Error ${isEditing ? 'updating' : 'creating'} position`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{isEditing ? 'Edit Position' : 'Create New Position'}</h2>
        <button onClick={onCancel} className="btn btn-secondary" style={{ padding: '5px 15px' }}>
          ✕
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
            <label>Number of Weeks *</label>
            <input
              type="number"
              name="number_of_weeks"
              value={formData.number_of_weeks}
              onChange={handleChange}
              min="1"
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
              min="1"
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
            <label>Salary Information</label>
            <input
              type="text"
              name="salary_info"
              value={formData.salary_info}
              onChange={handleChange}
              placeholder="e.g., $20-25/hour"
            />
          </div>
          <div className="form-group">
            <label>Required Skills</label>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              placeholder="e.g., JavaScript, Python"
            />
          </div>
          <div className="form-group">
            <label>Preferred Skills</label>
            <input
              type="text"
              name="preferred_skills"
              value={formData.preferred_skills}
              onChange={handleChange}
              placeholder="e.g., React, Node.js"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Job Description *</label>
          <textarea
            name="job_description"
            value={formData.job_description}
            onChange={handleChange}
            required
            style={{ minHeight: '120px' }}
          />
        </div>
        {isEditing && (
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <div style={{ marginTop: '15px' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : (isEditing ? 'Update Position' : 'Create Position')}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function PositionActions({ position, onUpdate, onEdit }) {
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
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
      <button 
        onClick={fetchApplicants}
        className="btn btn-secondary"
        disabled={loading}
        style={{ padding: '5px 10px', fontSize: '14px' }}
      >
        Applicants
      </button>
      <button 
        onClick={onEdit}
        className="btn btn-primary"
        style={{ padding: '5px 10px', fontSize: '14px' }}
      >
        Edit
      </button>
      {position.status === 'open' && (
        <button 
          onClick={() => handleStatusChange('closed')}
          className="btn btn-danger"
          style={{ padding: '5px 10px', fontSize: '14px' }}
        >
          Close
        </button>
      )}
      {position.status === 'closed' && (
        <button 
          onClick={() => handleStatusChange('open')}
          className="btn btn-success"
          style={{ padding: '5px 10px', fontSize: '14px' }}
        >
          Reopen
        </button>
      )}
      {showApplicants && (
        <SelectStudentModal
          applicants={applicants}
          onSelect={handleSelectStudent}
          onClose={() => setShowApplicants(false)}
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
      <div className="card" style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Applicants for This Position</h2>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '5px 15px' }}>✕</button>
        </div>
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
                      <a 
                        href={getFileUrl(applicant.resume_path)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      'None'
                    )}
                  </td>
                  {showSelectButton && (
                    <td>
                      <button 
                        onClick={() => onSelect(applicant.student_id)}
                        className="btn btn-success"
                        style={{ padding: '5px 10px', fontSize: '14px' }}
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