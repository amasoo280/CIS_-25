# Co-op Portal System

A comprehensive web-based portal system for managing co-op (internship for credit) programs. Built for CIS 425 - Fall 2025.

## Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: React with React Router
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer

## Features

### For Students
- Create and manage student profiles
- Search and filter internship positions
- Apply to positions
- Upload resumes
- View application status
- Opt-in/opt-out for co-op credit (if eligible)
- Submit co-op summaries at the end of internships
- View grades assigned by faculty coordinators

### For Employers
- Create and manage company profiles
- Post internship positions with detailed requirements
- View applicants for each position
- Select students for positions
- Upload offer letters
- Manage position status (open/pending/closed)
- Automatic eligibility checking when selecting students

### For Faculty Coordinators
- View all co-op students in their department
- Review student profiles and internship details
- View co-op summaries submitted by students
- Assign grades to co-op students
- Department-based access control

## Key Business Logic

### Co-op Eligibility Rules
When an employer selects a student, the system automatically checks eligibility:

1. **GPA Requirement**: Minimum 2.0 GPA
2. **Duration Requirement**: At least 7 weeks
3. **Hours Requirement**: Total hours (weeks × hours/week) ≥ 140
4. **Semester Requirement**:
   - Transfer students: Must have completed at least 1 semester
   - Non-transfer students: Must have completed at least 2 semesters

### Email Notifications
- When a student is selected and eligible, an email notification is sent (currently logged to console)
- The system uses a pluggable email service that can be extended to use real email providers

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Install Dependencies

From the root directory:

```bash
npm run install-all
```

Or manually:

```bash
npm install
cd server && npm install
cd ../client && npm install
```

### Step 2: Initialize Database

```bash
npm run init-db
```

This will:
- Create the SQLite database
- Create all necessary tables
- Seed sample data

**Default Login Credentials** (all use password: `password123`):
- **Faculty**: `faculty@university.edu`
- **Employer**: `employer@techcorp.com`
- **Student**: `student@university.edu`

### Step 3: Start the Application

**Option 1: Run both server and client together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
coop-portal/
├── server/
│   ├── database/
│   │   └── db.js                 # Database connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── employers.js          # Employer routes
│   │   ├── students.js           # Student routes
│   │   ├── positions.js          # Position routes
│   │   ├── applications.js       # Application routes
│   │   ├── coop.js               # Co-op enrollment routes
│   │   ├── faculty.js            # Faculty coordinator routes
│   │   └── upload.js             # File upload routes
│   ├── services/
│   │   ├── eligibilityService.js # Co-op eligibility logic
│   │   └── emailService.js       # Email notification service
│   ├── scripts/
│   │   └── initDatabase.js       # Database initialization script
│   ├── uploads/                  # Uploaded files directory
│   └── index.js                  # Express server entry point
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.js
│   │   ├── context/
│   │   │   └── AuthContext.js    # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── RegisterStudent.js
│   │   │   ├── RegisterEmployer.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── EmployerDashboard.js
│   │   │   ├── FacultyDashboard.js
│   │   │   ├── PositionSearch.js
│   │   │   ├── PositionDetail.js
│   │   │   ├── StudentProfile.js
│   │   │   └── EmployerProfile.js
│   │   ├── utils/
│   │   │   └── api.js            # API utility functions
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register/student` - Register as student
- `POST /api/auth/register/employer` - Register as employer

### Students
- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update student profile
- `PUT /api/students/resume` - Update resume path

### Employers
- `GET /api/employers/profile` - Get employer profile
- `PUT /api/employers/profile` - Update employer profile

### Positions
- `GET /api/positions` - Get all positions (with filters)
- `GET /api/positions/:id` - Get single position
- `POST /api/positions` - Create position (employer only)
- `PUT /api/positions/:id` - Update position (employer only)
- `GET /api/positions/employer/my-positions` - Get employer's positions
- `POST /api/positions/:id/select-student` - Select student for position

### Applications
- `POST /api/applications` - Apply to position (student only)
- `GET /api/applications/my-applications` - Get student's applications
- `GET /api/applications/position/:positionId` - Get applicants for position
- `PUT /api/applications/:id/status` - Update application status

### Co-op Enrollment
- `GET /api/coop/my-enrollment` - Get student's co-op enrollments
- `POST /api/coop/opt-in` - Opt in for co-op credit
- `POST /api/coop/opt-out` - Opt out of co-op credit
- `POST /api/coop/summary` - Submit co-op summary

### Faculty
- `GET /api/faculty/coop-students` - Get co-op students in department
- `GET /api/faculty/coop-students/:enrollmentId` - Get enrollment details
- `PUT /api/faculty/coop-students/:enrollmentId/grade` - Assign grade

### File Upload
- `POST /api/upload/resume` - Upload resume (student only)
- `POST /api/upload/offer-letter` - Upload offer letter (employer only)

## Demo Guide

### 10-Minute Demo Flow

#### 1. Introduction (1 minute)
- Explain the system purpose: Co-op Portal for managing internships for credit
- Tech stack overview: Node.js/Express backend, React frontend, SQLite database
- Three main user roles: Students, Employers, Faculty Coordinators

#### 2. Student Flow (3 minutes)
- **Login as Student**: `student@university.edu` / `password123`
- **View Profile**: Show student information
- **Search Positions**: Use filters (employer name, location, major, skills)
- **Apply to Position**: Click "Apply Now" on a position
- **View Applications**: Check application status in dashboard
- **Co-op Eligibility**: Show eligibility check (if selected by employer)
- **Opt-in for Credit**: Demonstrate opt-in process
- **Submit Summary**: Show co-op summary submission form

#### 3. Employer Flow (3 minutes)
- **Login as Employer**: `employer@techcorp.com` / `password123`
- **Create Position**: Fill out position form with all required fields
- **View Applicants**: Show list of applicants for a position
- **Select Student**: Choose a student and trigger eligibility check
- **View Position Status**: Show pending/closed status management
- **Upload Offer Letter**: Demonstrate file upload (if time permits)

#### 4. Faculty Coordinator Flow (2 minutes)
- **Login as Faculty**: `faculty@university.edu` / `password123`
- **View Co-op Students**: Show list of students in department
- **Review Student Details**: View profile, position, and summary
- **Assign Grade**: Enter and submit grade for a student

#### 5. Key Features Highlight (1 minute)
- **Eligibility Logic**: Explain the automatic eligibility checking
- **Email Notifications**: Show console logs of email notifications
- **Role-based Access**: Demonstrate different views per role
- **File Uploads**: Show resume and offer letter handling

## Development Notes

### Database
- SQLite database file: `server/database/coop_portal.db`
- To reset database: Delete the `.db` file and run `npm run init-db` again

### Environment Variables
- Create `server/.env` file (see `server/.env.example`)
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)

### File Uploads
- Uploaded files are stored in `server/uploads/`
- Supported formats: PDF, DOC, DOCX
- Maximum file size: 10MB

### Email Service
- Currently logs to console
- Can be extended to use nodemailer, SendGrid, AWS SES, etc.
- See `server/services/emailService.js`

## Team Contributions

This project was developed as part of CIS 425 - Fall 2025. All team members contributed to:
- Database schema design
- Backend API development
- Frontend React components
- Business logic implementation
- Testing and debugging

## Future Enhancements

- Real email integration (SendGrid/AWS SES)
- Advanced search and filtering
- Email notifications for all status changes
- Dashboard analytics and reporting
- Mobile-responsive improvements
- Admin panel for system management
- Integration with university systems

## License

This project is developed for educational purposes as part of CIS 425 coursework.

