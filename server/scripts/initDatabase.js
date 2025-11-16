const { getDB, closeDB } = require('../database/db');
const bcrypt = require('bcryptjs');

const db = getDB();

// Create all tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Employers table
      db.run(`CREATE TABLE IF NOT EXISTS employers (
        employer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        location TEXT NOT NULL,
        website TEXT,
        contact_name TEXT NOT NULL,
        contact_email TEXT UNIQUE NOT NULL,
        contact_phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
      });

      // Faculty coordinators table
      db.run(`CREATE TABLE IF NOT EXISTS faculty (
        faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
      });

      // Students table
      db.run(`CREATE TABLE IF NOT EXISTS students (
        student_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        department TEXT NOT NULL,
        major TEXT NOT NULL,
        credit_hours INTEGER NOT NULL,
        gpa REAL NOT NULL,
        semester_started TEXT NOT NULL,
        is_transfer INTEGER DEFAULT 0,
        resume_path TEXT,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
      });

      // Positions table
      db.run(`CREATE TABLE IF NOT EXISTS positions (
        position_id INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id INTEGER NOT NULL,
        job_title TEXT NOT NULL,
        job_description TEXT NOT NULL,
        number_of_weeks INTEGER NOT NULL,
        hours_per_week INTEGER NOT NULL,
        job_location TEXT NOT NULL,
        majors_of_interest TEXT NOT NULL,
        required_skills TEXT,
        preferred_skills TEXT,
        salary_info TEXT,
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'pending', 'closed')),
        selected_student_id INTEGER,
        offer_letter_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employer_id) REFERENCES employers(employer_id),
        FOREIGN KEY (selected_student_id) REFERENCES students(student_id)
      )`, (err) => {
        if (err) reject(err);
      });

      // Applications table
      db.run(`CREATE TABLE IF NOT EXISTS applications (
        application_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        position_id INTEGER NOT NULL,
        application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'applied' CHECK(status IN ('applied', 'shortlisted', 'rejected', 'selected')),
        notes TEXT,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (position_id) REFERENCES positions(position_id),
        UNIQUE(student_id, position_id)
      )`, (err) => {
        if (err) reject(err);
      });

      // Co-op enrollment table
      db.run(`CREATE TABLE IF NOT EXISTS coop_enrollments (
        enrollment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        position_id INTEGER NOT NULL,
        eligibility_result TEXT NOT NULL CHECK(eligibility_result IN ('eligible', 'ineligible')),
        eligibility_reason TEXT,
        opt_in INTEGER DEFAULT 0,
        coop_summary TEXT,
        grade TEXT,
        department TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(student_id),
        FOREIGN KEY (position_id) REFERENCES positions(position_id),
        UNIQUE(student_id, position_id)
      )`, (err) => {
        if (err) reject(err);
      });

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

// Seed initial data
const seedData = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create sample faculty coordinator
      db.run(`INSERT OR IGNORE INTO faculty (full_name, email, department, password_hash)
        VALUES (?, ?, ?, ?)`,
        ['Dr. Jane Smith', 'faculty@university.edu', 'Computer Science', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding faculty:', err);
        }
      );

      // Create sample employer
      db.run(`INSERT OR IGNORE INTO employers (company_name, location, website, contact_name, contact_email, contact_phone, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Tech Corp', 'San Francisco, CA', 'https://techcorp.com', 'John Doe', 'employer@techcorp.com', '555-0100', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding employer:', err);
        }
      );

      // Create sample student
      db.run(`INSERT OR IGNORE INTO students (full_name, email, phone, department, major, credit_hours, gpa, semester_started, is_transfer, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Alice Johnson', 'student@university.edu', '555-0200', 'Computer Science', 'Computer Science', 60, 3.5, 'Fall 2023', 0, hashedPassword],
        (err) => {
          if (err) console.error('Error seeding student:', err);
          else resolve();
        }
      );
    });
  });
};

// Main initialization
(async () => {
  try {
    console.log('Initializing database...');
    await createTables();
    console.log('Tables created successfully');
    await seedData();
    console.log('Sample data seeded');
    console.log('\nDefault login credentials (all roles):');
    console.log('Email: varies by role');
    console.log('Password: password123');
    console.log('\nSample accounts:');
    console.log('- Faculty: faculty@university.edu');
    console.log('- Employer: employer@techcorp.com');
    console.log('- Student: student@university.edu');
    closeDB();
  } catch (error) {
    console.error('Error initializing database:', error);
    closeDB();
    process.exit(1);
  }
})();

