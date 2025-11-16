import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function StudentDashboard() {
  const [applications, setApplications] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, enrollRes] = await Promise.all([
        api.get('/applications/my-applications'),
        api.get('/coop/my-enrollment')
      ]);
      setApplications(appsRes.data || []);
      setEnrollments(enrollRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent blank page
      setApplications([]);
      setEnrollments([]);
      if (error.response?.status !== 401) {
        alert('Error loading dashboard data. Please refresh the page.');
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.application_id}>
                  <td><Link to={`/positions/${app.position_id}`}>{app.job_title}</Link></td>
                  <td>{app.company_name}</td>
                  <td>{app.status}</td>
                  <td>{new Date(app.application_date).toLocaleDateString()}</td>
                  <td>
                    {app.position_status === 'pending' && app.selected_student_id && (
                      <span style={{ color: 'green' }}>Selected!</span>
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
          <p>No co-op enrollments yet.</p>
        ) : (
          <div>
            {enrollments.map(enrollment => (
              <div key={enrollment.enrollment_id} className="card" style={{ marginBottom: '15px' }}>
                <h3>{enrollment.job_title} at {enrollment.company_name}</h3>
                <p><strong>Eligibility:</strong> {enrollment.eligibility_result}</p>
                {enrollment.eligibility_reason && (
                  <p><strong>Reason:</strong> {enrollment.eligibility_reason}</p>
                )}
                {enrollment.eligibility_result === 'eligible' && (
                  <div>
                    {enrollment.opt_in === 0 ? (
                      <div>
                        <p style={{ color: 'green', fontWeight: 'bold' }}>
                          You are eligible for co-op credit! Would you like to opt in?
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
                          No, I'll do it without credit
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ color: 'green' }}>✓ You have opted in for co-op credit</p>
                        {!enrollment.coop_summary ? (
                          <div>
                            <h4>Submit Co-op Summary</h4>
                            <CoopSummaryForm 
                              positionId={enrollment.position_id} 
                              onSuccess={fetchData}
                            />
                          </div>
                        ) : (
                          <div>
                            <p><strong>Summary submitted:</strong></p>
                            <p>{enrollment.coop_summary}</p>
                            {enrollment.grade && (
                              <p><strong>Grade:</strong> {enrollment.grade}</p>
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
        <label>Co-op Summary *</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          required
          placeholder="Describe your co-op experience..."
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Summary'}
      </button>
    </form>
  );
}

export default StudentDashboard;

