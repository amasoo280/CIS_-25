# Quick Start Guide

## Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Initialize the database:**
   ```bash
   npm run init-db
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Default Login Credentials

All accounts use password: `password123`

- **Faculty Coordinator**: `faculty@university.edu`
- **Employer**: `employer@techcorp.com`
- **Student**: `student@university.edu`

## Quick Test Flow

1. **Login as Student** → Browse positions → Apply to a position
2. **Login as Employer** → Create a position → View applicants → Select a student
3. **Login as Student** → Check eligibility → Opt-in for co-op credit
4. **Login as Faculty** → View co-op students → Assign grades

## Troubleshooting

- **Database errors**: Delete `server/database/coop_portal.db` and run `npm run init-db` again
- **Port already in use**: Change PORT in `server/.env` or kill the process using port 5000/3000
- **Module not found**: Run `npm install` in both root, server, and client directories

