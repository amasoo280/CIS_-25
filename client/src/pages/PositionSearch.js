import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

function PositionSearch() {
  const [positions, setPositions] = useState([]);
  const [filters, setFilters] = useState({
    employer_name: '',
    location: '',
    major: '',
    skills: '',
    status: 'open'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/positions?${params.toString()}`);
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPositions();
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Browse Positions</h1>
      
      <div className="card">
        <h2>Search Filters</h2>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Employer Name</label>
              <input
                type="text"
                name="employer_name"
                value={filters.employer_name}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Remote, San Francisco"
              />
            </div>
            <div className="form-group">
              <label>Major</label>
              <input
                type="text"
                name="major"
                value={filters.major}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>Skills</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <div className="card">
        <h2>Available Positions ({positions.length})</h2>
        {positions.length === 0 ? (
          <p>No positions found matching your criteria.</p>
        ) : (
          <div>
            {positions.map(position => (
              <div key={position.position_id} className="card" style={{ marginBottom: '15px' }}>
                <h3>
                  <Link to={`/positions/${position.position_id}`}>
                    {position.job_title}
                  </Link>
                </h3>
                <p><strong>Company:</strong> {position.company_name}</p>
                <p><strong>Location:</strong> {position.job_location}</p>
                <p><strong>Duration:</strong> {position.number_of_weeks} weeks, {position.hours_per_week} hours/week</p>
                <p><strong>Majors:</strong> {position.majors_of_interest}</p>
                <p><strong>Status:</strong> {position.status}</p>
                <p>{position.job_description.substring(0, 200)}...</p>
                <Link to={`/positions/${position.position_id}`}>
                  <button className="btn btn-primary">View Details</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PositionSearch;

