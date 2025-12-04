const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employerRoutes = require('./routes/employers');
const studentRoutes = require('./routes/students');
const positionRoutes = require('./routes/positions');
const applicationRoutes = require('./routes/applications');
const coopRoutes = require('./routes/coop');
const facultyRoutes = require('./routes/faculty');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files - IMPORTANT: This must be before API routes
// Files are accessed at http://localhost:5001/uploads/filename.pdf
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/coop', coopRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Co-op Portal API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads served at: http://localhost:${PORT}/uploads/`);
});