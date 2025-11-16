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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

