import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError(null);
    try {
      const [appsRes, enrollRes] = await Promise.all([
        api.get('/applications/my-applications').catch(e => ({ data: [] })),
        api.get('/coop/my-enrollment').catch(e => ({ data: [] }))
      ]);
      setApplications(appsRes.data || []);
      setEnrollments(enrollRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setApplications([]);
      setEnrollments([]);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setError('Error loading dashboard data. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptIn = async (positionId) => {
    try {
      await api.post('/coop/opt-in', { position_id: positionId });
      alert('Successfully opted in for co-op credit!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error opting in');
    }
  };

  const handleOptOut = async (positionId) => {
    try {
      await api.post('/coop/opt-out', { position_id: positionId });
      alert('Successfully opted out of co-op credit');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Error opting out');
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Student Dashboard</h1>

      {error && (
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
          <p style={{ margin: 0, color: '#856404' }}>{error}</p>
        </div>
      )}
      
      <div className="card">
        <h2>My Applications</h2>
        {applications.length === 0 ? (
          <p>You haven't applied to any positions yet. <Link to="/positions">Browse positions</Link></p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Company</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.application_id}>
                  <td><Link to={`/positions/${app.position_id}`}>{app.job_title}</Link></td>
                  <td>{app.company_name}</td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: app.status === 'selected' ? '#d4edda' : 
                                       app.status === 'rejected' ? '#f8d7da' : 
                                       app.status === 'shortlisted' ? '#cce5ff' : '#e2e3e5',
                      color: app.status === 'selected' ? '#155724' : 
                             app.status === 'rejected' ? '#721c24' : 
                             app.status === 'shortlisted' ? '#004085' : '#383d41'
                    }}>
                      {app.status}
                    </span>
                  </td>
                  <td>{new Date(app.application_date).toLocaleDateString()}</td>
                  <td>
                    {app.status === 'selected' && (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>🎉 Congratulations! You've been selected!</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Co-op Enrollments</h2>
        {enrollments.length === 0 ? (
          <p>No co-op enrollments yet. Once you're selected for a position, you'll see your eligibility status here.</p>
        ) : (
          <div>
            {enrollments.map(enrollment => (
              <div key={enrollment.enrollment_id} className="card" style={{ marginBottom: '15px', border: '1px solid #e0e0e0' }}>
                <h3>{enrollment.job_title} at {enrollment.company_name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                  <p><strong>Duration:</strong> {enrollment.number_of_weeks} weeks, {enrollment.hours_per_week} hrs/week</p>
                  <p><strong>Total Hours:</strong> {enrollment.number_of_weeks * enrollment.hours_per_week} hours</p>
                </div>
                
                <p>
                  <strong>Eligibility:</strong>{' '}
                  <span style={{ 
                    color: enrollment.eligibility_result === 'eligible' ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {enrollment.eligibility_result === 'eligible' ? '✓ Eligible for Co-op Credit' : '✗ Not Eligible'}
                  </span>
                </p>
                
                {enrollment.eligibility_reason && (
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    <strong>Reason:</strong> {enrollment.eligibility_reason}
                  </p>
                )}
                
                {enrollment.eligibility_result === 'eligible' && (
                  <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    {enrollment.opt_in === 0 ? (
                      <div>
                        <p style={{ color: 'green', fontWeight: 'bold', marginBottom: '10px' }}>
                          🎓 You are eligible for co-op credit! Would you like to opt in?
                        </p>
                        <button 
                          onClick={() => handleOptIn(enrollment.position_id)}
                          className="btn btn-success"
                        >
                          Yes, I want co-op credit
                        </button>
                        <button 
                          onClick={() => handleOptOut(enrollment.position_id)}
                          className="btn btn-secondary"
                          style={{ marginLeft: '10px' }}
                        >
                          No thanks
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'green', marginBottom: '15px' }}>
                          ✓ You have opted in for co-op credit
                        </p>
                        {!enrollment.coop_summary ? (
                          <div>
                            <h4>Submit Your Co-op Summary</h4>
                            <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                              Please describe your co-op experience. This summary will be reviewed by your faculty coordinator to determine your grade.
                            </p>
                            <CoopSummaryForm 
                              positionId={enrollment.position_id} 
                              onSuccess={fetchData}
                            />
                          </div>
                        ) : (
                          <div>
                            <h4>Your Submitted Summary</h4>
                            <div style={{ 
                              padding: '15px', 
                              backgroundColor: '#e8f4f8', 
                              borderRadius: '4px',
                              border: '1px solid #bee5eb',
                              marginBottom: '10px'
                            }}>
                              {enrollment.coop_summary}
                            </div>
                            {enrollment.grade ? (
                              <p style={{ marginTop: '10px' }}>
                                <strong>Grade Received:</strong>{' '}
                                <span style={{ 
                                  fontSize: '18px', 
                                  fontWeight: 'bold', 
                                  color: '#28a745',
                                  padding: '2px 10px',
                                  backgroundColor: '#d4edda',
                                  borderRadius: '4px'
                                }}>
                                  {enrollment.grade}
                                </span>
                              </p>
                            ) : (
                              <p style={{ color: '#856404' }}>
                                ⏳ Awaiting grade from faculty coordinator...
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoopSummaryForm({ positionId, onSuccess }) {
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      alert('Please enter your co-op summary');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/coop/summary', { position_id: positionId, coop_summary: summary });
      alert('Co-op summary submitted successfully!');
      setSummary('');
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.error || 'Error submitting summary');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          placeholder="Describe your co-op experience, what you learned, projects you worked on, skills developed, etc..."
          style={{ minHeight: '150px' }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Summary'}
      </button>
    </form>
  );
}

export default StudentDashboard;