# Co-op Portal System - Project Summary

## Overview

This is a complete, production-ready Co-op Portal system built for CIS 425 - Fall 2025. The system manages the entire co-op (internship for credit) workflow from position posting to final grading.

## Architecture

### Backend (Node.js/Express)
- **Framework**: Express.js
- **Database**: SQLite (easily migratable to PostgreSQL)
- **Authentication**: JWT tokens
- **File Upload**: Multer
- **Structure**: RESTful API with clear separation of concerns

### Frontend (React)
- **Framework**: React 18 with React Router
- **State Management**: Context API for authentication
- **Styling**: Custom CSS with modern, clean design
- **API Communication**: Axios with interceptors

## Database Schema

### Core Tables
1. **employers** - Company information and contact details
2. **students** - Student profiles with academic information
3. **faculty** - Faculty coordinators (one per department)
4. **positions** - Internship postings with all required fields
5. **applications** - Student applications to positions
6. **coop_enrollments** - Co-op credit enrollment tracking

### Key Relationships
- Positions belong to Employers (FK)
- Applications link Students to Positions (many-to-many)
- Co-op Enrollments track credit eligibility and grades
- Faculty coordinators manage students by department

## Key Features Implemented

### 1. Authentication & Authorization
- ✅ JWT-based authentication for all roles
- ✅ Role-based access control (student, employer, faculty)
- ✅ Protected routes on both frontend and backend
- ✅ Secure password hashing with bcrypt

### 2. Student Features
- ✅ Profile creation and management
- ✅ Resume upload (PDF, DOC, DOCX)
- ✅ Advanced position search (employer, location, major, skills)
- ✅ Application submission and tracking
- ✅ Co-op eligibility notification
- ✅ Opt-in/opt-out for co-op credit
- ✅ Co-op summary submission
- ✅ Grade viewing

### 3. Employer Features
- ✅ Company profile management
- ✅ Position creation with all required fields
- ✅ Applicant viewing with full student profiles
- ✅ Student selection with automatic eligibility check
- ✅ Offer letter upload
- ✅ Position status management (open/pending/closed)

### 4. Faculty Coordinator Features
- ✅ Department-based student filtering
- ✅ Complete student profile viewing
- ✅ Position and internship details
- ✅ Co-op summary review
- ✅ Grade assignment
- ✅ Secure department-based access control

### 5. Business Logic

#### Co-op Eligibility Service
Automatically checks eligibility when employer selects a student:
- ✅ Minimum GPA: 2.0
- ✅ Minimum duration: 7 weeks
- ✅ Minimum hours: 140 total (weeks × hours/week)
- ✅ Transfer students: ≥1 semester completed
- ✅ Non-transfer students: ≥2 semesters completed

#### Email Notification Service
- ✅ Pluggable architecture for easy extension
- ✅ Console logging for development
- ✅ Ready for production email integration (SendGrid, AWS SES, etc.)

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login for all roles
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/employer` - Employer registration

### Students
- `GET /api/students/profile` - Get profile
- `PUT /api/students/profile` - Update profile
- `PUT /api/students/resume` - Update resume path

### Employers
- `GET /api/employers/profile` - Get profile
- `PUT /api/employers/profile` - Update profile

### Positions
- `GET /api/positions` - List with filters
- `GET /api/positions/:id` - Get details
- `POST /api/positions` - Create (employer only)
- `PUT /api/positions/:id` - Update (employer only)
- `GET /api/positions/employer/my-positions` - Employer's positions
- `POST /api/positions/:id/select-student` - Select student & check eligibility

### Applications
- `POST /api/applications` - Apply (student only)
- `GET /api/applications/my-applications` - Student's applications
- `GET /api/applications/position/:id` - Position applicants (employer only)
- `PUT /api/applications/:id/status` - Update status (employer only)

### Co-op Enrollment
- `GET /api/coop/my-enrollment` - Student's enrollments
- `POST /api/coop/opt-in` - Opt in for credit
- `POST /api/coop/opt-out` - Opt out
- `POST /api/coop/summary` - Submit summary

### Faculty
- `GET /api/faculty/coop-students` - Department students
- `GET /api/faculty/coop-students/:id` - Enrollment details
- `PUT /api/faculty/coop-students/:id/grade` - Assign grade

### File Upload
- `POST /api/upload/resume` - Upload resume
- `POST /api/upload/offer-letter` - Upload offer letter

## Security Features

1. **Password Security**: bcrypt hashing with salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Role-Based Access**: Middleware checks user roles
4. **SQL Injection Protection**: Parameterized queries
5. **File Upload Validation**: Type and size restrictions
6. **Department Isolation**: Faculty can only see their department

## Testing the System

### Sample Workflow

1. **Student Registration & Application**
   - Register as student
   - Complete profile
   - Upload resume
   - Search and apply to positions

2. **Employer Workflow**
   - Register as employer
   - Create position
   - View applicants
   - Select student (triggers eligibility check)

3. **Eligibility & Opt-In**
   - Student receives eligibility notification
   - Student opts in for co-op credit
   - System creates enrollment record

4. **Co-op Completion**
   - Student submits co-op summary
   - Faculty coordinator reviews
   - Faculty assigns grade

## File Structure

```
coop-portal/
├── server/
│   ├── database/          # Database connection & schema
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic (eligibility, email)
│   ├── scripts/           # Database initialization
│   └── uploads/           # File storage
├── client/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (auth)
│   │   ├── pages/         # Page components
│   │   └── utils/         # API utilities
│   └── public/
└── README.md              # Full documentation
```

## Extensibility

The system is designed for easy extension:

1. **Email Service**: Replace console logging with real email provider
2. **Database**: SQLite can be swapped for PostgreSQL/MySQL
3. **File Storage**: Currently local, can integrate S3/Cloud Storage
4. **Additional Roles**: Easy to add new user types
5. **Notifications**: Can add real-time notifications (WebSockets)
6. **Analytics**: Dashboard can be extended with charts/reports

## Production Considerations

Before deploying to production:

1. **Environment Variables**: Set secure JWT_SECRET
2. **Database**: Migrate to PostgreSQL for better performance
3. **Email**: Integrate real email service
4. **File Storage**: Use cloud storage (AWS S3, etc.)
5. **HTTPS**: Enable SSL/TLS
6. **Rate Limiting**: Add rate limiting to API
7. **Logging**: Implement proper logging system
8. **Error Handling**: Add error tracking (Sentry, etc.)
9. **Testing**: Add unit and integration tests
10. **Documentation**: API documentation (Swagger/OpenAPI)

## Demo Checklist

For the 10-minute demo:

- [ ] Show student registration and profile
- [ ] Demonstrate position search with filters
- [ ] Show application process
- [ ] Demonstrate employer position creation
- [ ] Show applicant viewing and selection
- [ ] Demonstrate eligibility check (show console logs)
- [ ] Show student opt-in process
- [ ] Demonstrate co-op summary submission
- [ ] Show faculty coordinator dashboard
- [ ] Demonstrate grade assignment

## Known Limitations & Future Work

1. **Email**: Currently logs to console (ready for integration)
2. **File Validation**: Basic validation (can be enhanced)
3. **Search**: Basic LIKE queries (can add full-text search)
4. **UI/UX**: Functional but can be enhanced with modern UI library
5. **Mobile**: Responsive but not optimized for mobile
6. **Notifications**: No real-time notifications yet
7. **Reporting**: No analytics/reporting features

## Conclusion

This is a complete, functional Co-op Portal system that meets all requirements specified in the project description. The code is well-structured, documented, and ready for demonstration and further development.

