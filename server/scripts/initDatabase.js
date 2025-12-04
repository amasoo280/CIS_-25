const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../database/coop_portal.db');

// Ensure database directory exists
const fs = require('fs');
const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

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
        if (err) console.error('Error creating employers table:', err);
      });

      // Faculty coordinators table - one per department
      db.run(`CREATE TABLE IF NOT EXISTS faculty (
        faculty_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating faculty table:', err);
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
        if (err) console.error('Error creating students table:', err);
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
        if (err) console.error('Error creating positions table:', err);
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
        if (err) console.error('Error creating applications table:', err);
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
        if (err) console.error('Error creating coop_enrollments table:', err);
      });

      // Employer comments table (for feedback on co-op summaries)
      db.run(`CREATE TABLE IF NOT EXISTS employer_comments (
        comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        enrollment_id INTEGER NOT NULL,
        employer_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enrollment_id) REFERENCES coop_enrollments(enrollment_id),
        FOREIGN KEY (employer_id) REFERENCES employers(employer_id)
      )`, (err) => {
        if (err) console.error('Error creating employer_comments table:', err);
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
      // Create sample faculty coordinator for Computer Science
      db.run(`INSERT OR IGNORE INTO faculty (full_name, email, department, password_hash)
        VALUES (?, ?, ?, ?)`,
        ['Dr. Jane Smith', 'faculty@university.edu', 'Computer Science', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding faculty:', err);
        }
      );

      // Create sample employers
      db.run(`INSERT OR IGNORE INTO employers (company_name, location, website, contact_name, contact_email, contact_phone, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Tech Corp', 'San Francisco, CA', 'https://techcorp.com', 'John Doe', 'employer@techcorp.com', '555-0100', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding employer 1:', err);
        }
      );

      db.run(`INSERT OR IGNORE INTO employers (company_name, location, website, contact_name, contact_email, contact_phone, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['DataFlow Inc', 'New York, NY', 'https://dataflow.io', 'Sarah Miller', 'hr@dataflow.io', '555-0101', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding employer 2:', err);
        }
      );

      db.run(`INSERT OR IGNORE INTO employers (company_name, location, website, contact_name, contact_email, contact_phone, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['CloudBase Systems', 'Remote', 'https://cloudbase.com', 'Mike Chen', 'careers@cloudbase.com', '555-0102', hashedPassword],
        (err) => {
          if (err) console.error('Error seeding employer 3:', err);
        }
      );

      // Create sample student (in Computer Science department - matches faculty coordinator)
      db.run(`INSERT OR IGNORE INTO students (full_name, email, phone, department, major, credit_hours, gpa, semester_started, is_transfer, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Alice Johnson', 'student@university.edu', '555-0200', 'Computer Science', 'Computer Science', 60, 3.5, 'Fall 2023', 0, hashedPassword],
        (err) => {
          if (err) console.error('Error seeding student:', err);
        }
      );

      // Create sample positions
      db.run(`INSERT OR IGNORE INTO positions (employer_id, job_title, job_description, number_of_weeks, hours_per_week, job_location, majors_of_interest, required_skills, preferred_skills, salary_info, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Software Engineering Intern', 
         'Join our engineering team to work on cutting-edge web applications. You will be involved in full-stack development, code reviews, and agile sprints.',
         12, 40, 'San Francisco, CA',
         'Computer Science, Software Engineering, Information Technology',
         'JavaScript, Python, Git',
         'React, Node.js, SQL, AWS',
         '$25-30/hour',
         'open'],
        (err) => {
          if (err) console.error('Error seeding position 1:', err);
        }
      );

      db.run(`INSERT OR IGNORE INTO positions (employer_id, job_title, job_description, number_of_weeks, hours_per_week, job_location, majors_of_interest, required_skills, preferred_skills, salary_info, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'Data Science Intern', 
         'Work with our data science team to analyze large datasets and build machine learning models.',
         10, 35, 'San Francisco, CA',
         'Computer Science, Data Science, Mathematics, Statistics',
         'Python, SQL, Statistics',
         'TensorFlow, Pandas, Tableau, R',
         '$28-32/hour',
         'open'],
        (err) => {
          if (err) console.error('Error seeding position 2:', err);
        }
      );

      db.run(`INSERT OR IGNORE INTO positions (employer_id, job_title, job_description, number_of_weeks, hours_per_week, job_location, majors_of_interest, required_skills, preferred_skills, salary_info, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [2, 'Backend Developer Intern', 
         'Help build scalable backend services for our data processing platform.',
         8, 40, 'New York, NY',
         'Computer Science, Software Engineering',
         'Java, Python, REST APIs',
         'Spring Boot, Docker, Kubernetes, PostgreSQL',
         '$30-35/hour',
         'open'],
        (err) => {
          if (err) console.error('Error seeding position 3:', err);
        }
      );

      db.run(`INSERT OR IGNORE INTO positions (employer_id, job_title, job_description, number_of_weeks, hours_per_week, job_location, majors_of_interest, required_skills, preferred_skills, salary_info, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [3, 'Cloud Infrastructure Intern', 
         'Remote internship to work on cloud infrastructure and DevOps practices.',
         12, 20, 'Remote',
         'Computer Science, Information Technology, Cybersecurity',
         'Linux, Basic networking, Git',
         'AWS, Terraform, Docker, Python scripting',
         '$24-28/hour',
         'open'],
        (err) => {
          if (err) console.error('Error seeding position 4:', err);
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
    console.log('\n========================================');
    console.log('Default login credentials (all roles):');
    console.log('Password: password123');
    console.log('\nSample accounts:');
    console.log('- Faculty: faculty@university.edu (Computer Science dept)');
    console.log('- Employer: employer@techcorp.com');
    console.log('- Student: student@university.edu (Computer Science dept)');
    console.log('========================================\n');
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    db.close();
    process.exit(1);
  }
})();