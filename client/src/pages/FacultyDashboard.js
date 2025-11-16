import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/faculty/coop-students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Set empty array on error to prevent blank page
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

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Faculty Coordinator Dashboard</h1>
      
      <div className="card">
        <h2>Co-op Students in My Department</h2>
        {students.length === 0 ? (
          <p>No co-op students in your department yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Position</th>
                <th>Company</th>
                <th>Summary Submitted</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.enrollment_id}>
                  <td>{student.full_name}</td>
                  <td>{student.job_title}</td>
                  <td>{student.company_name}</td>
                  <td>{student.coop_summary ? 'Yes' : 'No'}</td>
                  <td>{student.grade || 'Not graded'}</td>
                  <td>
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="btn btn-primary"
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
        <h2>Student Details</h2>
        
        <h3>Student Information</h3>
        <p><strong>Name:</strong> {student.full_name}</p>
        <p><strong>Email:</strong> {student.email}</p>
        <p><strong>Phone:</strong> {student.phone}</p>
        <p><strong>Major:</strong> {student.major}</p>
        <p><strong>GPA:</strong> {student.gpa}</p>
        <p><strong>Credit Hours:</strong> {student.credit_hours}</p>
        <p><strong>Semester Started:</strong> {student.semester_started}</p>
        <p><strong>Transfer Student:</strong> {student.is_transfer ? 'Yes' : 'No'}</p>
        {student.resume_path && (
          <p><strong>Resume:</strong> <a href={student.resume_path} target="_blank" rel="noopener noreferrer">View</a></p>
        )}

        <h3>Position Information</h3>
        <p><strong>Job Title:</strong> {student.job_title}</p>
        <p><strong>Company:</strong> {student.company_name}</p>
        <p><strong>Location:</strong> {student.job_location}</p>
        <p><strong>Duration:</strong> {student.number_of_weeks} weeks, {student.hours_per_week} hours/week</p>
        <p><strong>Description:</strong> {student.job_description}</p>

        <h3>Co-op Enrollment</h3>
        <p><strong>Eligibility:</strong> {student.eligibility_result}</p>
        {student.eligibility_reason && (
          <p><strong>Reason:</strong> {student.eligibility_reason}</p>
        )}

        <h3>Co-op Summary</h3>
        {student.coop_summary ? (
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '20px' }}>
            {student.coop_summary}
          </div>
        ) : (
          <p>Summary not yet submitted.</p>
        )}

        <h3>Grade Assignment</h3>
        <div className="form-group">
          <label>Grade</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="e.g., A, B, C, Pass, Fail"
          />
        </div>
        <button 
          onClick={() => onGradeSubmit(student.enrollment_id, grade)}
          className="btn btn-success"
        >
          Assign Grade
        </button>

        <button onClick={onClose} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
          Close
        </button>
      </div>
    </div>
  );
}

export default FacultyDashboard;

