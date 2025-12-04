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

function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, graded

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/faculty/coop-students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      if (error.response?.status !== 401) {
        alert('Error loading students. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (enrollmentId, grade) => {
    try {
      await api.put(`/faculty/coop-students/${enrollmentId}/grade`, { grade });
      alert('Grade assigned successfully!');
      fetchStudents();
      setSelectedStudent(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Error assigning grade');
    }
  };

  const filteredStudents = students.filter(student => {
    if (filter === 'pending') return !student.grade;
    if (filter === 'graded') return student.grade;
    return true;
  });

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Faculty Coordinator Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0', color: '#007bff' }}>{students.length}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Students</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d4edda', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0', color: '#28a745' }}>{students.filter(s => s.grade).length}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Graded</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0', color: '#856404' }}>{students.filter(s => !s.grade).length}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Pending Grade</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0', color: '#0c5460' }}>{students.filter(s => s.coop_summary).length}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Summaries Received</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Co-op Students in My Department</h2>
          <div>
            <label style={{ marginRight: '10px' }}>Filter: </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="all">All Students</option>
              <option value="pending">Pending Grade</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p>No co-op students found{filter !== 'all' ? ' matching the filter' : ' in your department yet'}.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Major</th>
                <th>Position</th>
                <th>Company</th>
                <th>Duration</th>
                <th>Summary</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.enrollment_id}>
                  <td>{student.full_name}</td>
                  <td>{student.major}</td>
                  <td>{student.job_title}</td>
                  <td>{student.company_name}</td>
                  <td>{student.number_of_weeks} weeks</td>
                  <td>
                    {student.coop_summary ? (
                      <span style={{ color: 'green' }}>✓ Submitted</span>
                    ) : (
                      <span style={{ color: '#999' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    {student.grade ? (
                      <span style={{ fontWeight: 'bold', color: '#28a745' }}>{student.grade}</span>
                    ) : (
                      <span style={{ color: '#ffc107' }}>Not graded</span>
                    )}
                  </td>
                  <td>
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="btn btn-primary"
                      style={{ padding: '5px 10px', fontSize: '14px' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onGradeSubmit={handleGradeSubmit}
        />
      )}
    </div>
  );
}

function StudentDetailModal({ student, onClose, onGradeSubmit }) {
  const [grade, setGrade] = useState(student.grade || '');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [student.enrollment_id]);

  const fetchComments = async () => {
    try {
      const response = await api.get(`/faculty/coop-students/${student.enrollment_id}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const totalHours = student.number_of_weeks * student.hours_per_week;

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
      <div className="card" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', margin: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Student Co-op Details</h2>
          <button onClick={onClose} className="btn btn-secondary">×</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          {/* Student Information */}
          <div>
            <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Student Information</h3>
            <p><strong>Name:</strong> {student.full_name}</p>
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Phone:</strong> {student.phone || 'Not provided'}</p>
            <p><strong>Major:</strong> {student.major}</p>
            <p><strong>GPA:</strong> {student.gpa}</p>
            <p><strong>Credit Hours:</strong> {student.credit_hours}</p>
            <p><strong>Semester Started:</strong> {student.semester_started}</p>
            <p><strong>Transfer Student:</strong> {student.is_transfer ? 'Yes' : 'No'}</p>
            {student.resume_path && (
              <p><strong>Resume:</strong> <a href={getFileUrl(student.resume_path)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '12px' }}>View Resume</a></p>
            )}
          </div>

          {/* Position Information */}
          <div>
            <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '5px' }}>Position Information</h3>
            <p><strong>Job Title:</strong> {student.job_title}</p>
            <p><strong>Company:</strong> {student.company_name}</p>
            <p><strong>Location:</strong> {student.job_location}</p>
            <p><strong>Duration:</strong> {student.number_of_weeks} weeks</p>
            <p><strong>Hours/Week:</strong> {student.hours_per_week}</p>
            <p><strong>Total Hours:</strong> {totalHours} hours</p>
            <p><strong>Eligibility:</strong> 
              <span style={{ color: student.eligibility_result === 'eligible' ? 'green' : 'red', marginLeft: '5px' }}>
                {student.eligibility_result === 'eligible' ? '✓ Eligible' : '✗ Not Eligible'}
              </span>
            </p>
          </div>
        </div>

        {/* Job Description */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ borderBottom: '2px solid #6c757d', paddingBottom: '5px' }}>Job Description</h3>
          <p style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
            {student.job_description}
          </p>
        </div>

        {/* Co-op Summary */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ borderBottom: '2px solid #17a2b8', paddingBottom: '5px' }}>Co-op Summary</h3>
          {student.coop_summary ? (
            <div style={{ padding: '15px', backgroundColor: '#e8f4f8', borderRadius: '4px', border: '1px solid #bee5eb' }}>
              {student.coop_summary}
            </div>
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>Student has not submitted their co-op summary yet.</p>
          )}
        </div>

        {/* Employer Comments */}
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ borderBottom: '2px solid #ffc107', paddingBottom: '5px' }}>Employer Comments</h3>
          {loadingComments ? (
            <p>Loading comments...</p>
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} style={{ padding: '10px', backgroundColor: '#fff8e1', borderRadius: '4px', marginBottom: '10px', border: '1px solid #ffe082' }}>
                <p style={{ margin: '0 0 5px 0' }}>{comment.comment_text}</p>
                <small style={{ color: '#666' }}>
                  — {comment.contact_name} from {comment.company_name}, {new Date(comment.created_at).toLocaleDateString()}
                </small>
              </div>
            ))
          ) : (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No employer comments yet.</p>
          )}
        </div>

        {/* Grade Assignment */}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0 }}>Grade Assignment</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="">Select Grade</option>
              <option value="A">A</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B">B</option>
              <option value="B-">B-</option>
              <option value="C+">C+</option>
              <option value="C">C</option>
              <option value="C-">C-</option>
              <option value="D+">D+</option>
              <option value="D">D</option>
              <option value="D-">D-</option>
              <option value="F">F</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Incomplete">Incomplete</option>
            </select>
            <button 
              onClick={() => {
                if (grade) {
                  onGradeSubmit(student.enrollment_id, grade);
                } else {
                  alert('Please select a grade');
                }
              }}
              className="btn btn-success"
              disabled={!grade}
            >
              {student.grade ? 'Update Grade' : 'Assign Grade'}
            </button>
            {student.grade && (
              <span style={{ marginLeft: '10px', color: '#28a745' }}>
                Current Grade: <strong>{student.grade}</strong>
              </span>
            )}
          </div>
          {!student.coop_summary && (
            <p style={{ color: '#856404', marginTop: '10px', marginBottom: 0 }}>
              ⚠️ Note: Student has not submitted their co-op summary yet.
            </p>
          )}
        </div>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;