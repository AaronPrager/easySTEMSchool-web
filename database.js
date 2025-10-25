const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, 'registrations.db');
        
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.createTables();
            }
        });
    }

    createTables() {
        // Create lessons table
        const createLessonsTable = `
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                student_name TEXT NOT NULL,
                title TEXT NOT NULL,
                subject TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                duration INTEGER NOT NULL,
                location TEXT NOT NULL,
                description TEXT,
                reminder INTEGER DEFAULT 0,
                is_recurring BOOLEAN DEFAULT 0,
                recurrence_type TEXT,
                occurrence_number INTEGER,
                total_occurrences INTEGER,
                recurrence_group_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES registrations(id)
            )
        `;

        this.db.exec(createLessonsTable, (err) => {
            if (err) {
                console.error('Error creating lessons table:', err.message);
            } else {
                console.log('Lessons table ready');
            }
        });

        const createRegistrationsTable = `
            CREATE TABLE IF NOT EXISTS registrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                registration_id TEXT UNIQUE NOT NULL,
                student_first_name TEXT NOT NULL,
                student_last_name TEXT NOT NULL,
                student_phone TEXT NOT NULL,
                student_email TEXT,
                student_date_of_birth TEXT NOT NULL,
                student_grade TEXT NOT NULL,
                school_name TEXT NOT NULL,
                parent_full_name TEXT NOT NULL,
                parent_email TEXT NOT NULL,
                parent_phone TEXT NOT NULL,
                parent_address TEXT NOT NULL,
                same_as_parent BOOLEAN NOT NULL,
                emergency_name TEXT,
                emergency_relationship TEXT,
                emergency_phone TEXT,
                emergency_email TEXT,
                emergency_address TEXT,
                subjects TEXT NOT NULL,
                specific_goals TEXT NOT NULL,
                learning_difficulties TEXT,
                additional_comments TEXT,
                how_did_you_hear TEXT,
                liability_release BOOLEAN NOT NULL,
                registration_date TEXT NOT NULL,
                user_agent TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        const createContactTable = `
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createRegistrationsTable, (err) => {
            if (err) {
                console.error('Error creating registrations table:', err.message);
            } else {
                console.log('Registrations table ready');
            }
        });

        this.db.run(createContactTable, (err) => {
            if (err) {
                console.error('Error creating contacts table:', err.message);
            } else {
                console.log('Contacts table ready');
            }
        });
        
        // Check and update table schema if needed
        this.updateTableSchema();
    }

    updateTableSchema() {
        // Check if student_date_of_birth column exists
        this.db.all("PRAGMA table_info(registrations)", (err, columns) => {
            if (err) {
                console.error('Error getting table info:', err);
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            console.log('Current columns:', columnNames);
            
            // Add missing columns
            const requiredColumns = [
                { name: 'student_date_of_birth', type: 'TEXT NOT NULL DEFAULT ""' },
                { name: 'student_email', type: 'TEXT' },
                { name: 'same_as_parent', type: 'BOOLEAN NOT NULL DEFAULT 0' },
                { name: 'emergency_name', type: 'TEXT' },
                { name: 'emergency_relationship', type: 'TEXT' },
                { name: 'emergency_phone', type: 'TEXT' },
                { name: 'emergency_email', type: 'TEXT' },
                { name: 'emergency_address', type: 'TEXT' },
                { name: 'specific_goals', type: 'TEXT NOT NULL DEFAULT ""' },
                { name: 'learning_difficulties', type: 'TEXT' },
                { name: 'additional_comments', type: 'TEXT' },
                { name: 'how_did_you_hear', type: 'TEXT' },
                { name: 'liability_release', type: 'BOOLEAN NOT NULL DEFAULT 0' }
            ];
            
            requiredColumns.forEach(col => {
                if (!columnNames.includes(col.name)) {
                    console.log(`Adding missing column: ${col.name}`);
                    this.db.exec(`ALTER TABLE registrations ADD COLUMN ${col.name} ${col.type}`);
                }
            });
        });
    }

    saveRegistration(registrationData) {
        return new Promise((resolve, reject) => {
            const {
                registrationId,
                parent,
                student,
                emergencyContact,
                additionalInfo,
                agreements,
                metadata
            } = registrationData;

            const sql = `
                INSERT INTO registrations (
                    registration_id, student_first_name, student_last_name, student_phone, student_email,
                    student_date_of_birth, student_grade, school_name, parent_full_name, parent_email, 
                    parent_phone, parent_address, same_as_parent, emergency_name, emergency_relationship, 
                    emergency_phone, emergency_email, emergency_address, subjects, specific_goals, 
                    learning_difficulties, additional_comments, how_did_you_hear, 
                    liability_release, 
                    registration_date, user_agent, ip_address
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                registrationId,
                student.firstName,
                student.lastName,
                student.phone,
                student.email || null,
                student.dateOfBirth,
                student.grade,
                student.schoolName,
                parent.fullName,
                parent.email,
                parent.phone,
                parent.address,
                emergencyContact.sameAsParent ? 1 : 0,
                emergencyContact.name || null,
                emergencyContact.relationship || null,
                emergencyContact.phone || null,
                emergencyContact.email || null,
                emergencyContact.address || null,
                additionalInfo.subjects,
                additionalInfo.specificGoals,
                additionalInfo.learningDifficulties || null,
                additionalInfo.additionalComments || null,
                additionalInfo.howDidYouHear || null,
                agreements.liabilityRelease ? 1 : 0,
                metadata.registrationDate,
                metadata.userAgent || null,
                metadata.ipAddress || null
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error saving registration:', err.message);
                    reject(err);
                } else {
                    console.log(`Registration saved with ID: ${this.lastID}`);
                    resolve({
                        id: this.lastID,
                        registrationId: registrationId
                    });
                }
            });
        });
    }

    saveContact(contactData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO contacts (first_name, last_name, email, phone, message, ip_address)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const params = [
                contactData.firstName,
                contactData.lastName,
                contactData.email,
                contactData.phone,
                contactData.message,
                contactData.ipAddress || null
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error saving contact:', err.message);
                    reject(err);
                } else {
                    console.log(`Contact saved with ID: ${this.lastID}`);
                    resolve({
                        id: this.lastID
                    });
                }
            });
        });
    }

    getRegistration(registrationId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM registrations WHERE registration_id = ?';
            
            this.db.get(sql, [registrationId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getAllRegistrations(limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT registration_id, parent_first_name, parent_last_name, parent_email, 
                       student_first_name, student_last_name, student_grade, registration_date, created_at
                FROM registrations 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(sql, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getAllContacts(limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, first_name, last_name, email, phone, created_at
                FROM contacts 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(sql, [limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    (SELECT COUNT(*) FROM registrations) as total_registrations,
                    (SELECT COUNT(*) FROM contacts) as total_contacts,
                    (SELECT COUNT(*) FROM registrations WHERE DATE(created_at) = DATE('now')) as today_registrations,
                    (SELECT COUNT(*) FROM contacts WHERE DATE(created_at) = DATE('now')) as today_contacts
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }

    // Get all registered students for lesson scheduling
    getAllStudents() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    id,
                    student_first_name,
                    student_last_name,
                    student_phone,
                    student_email,
                    student_date_of_birth,
                    student_grade,
                    school_name,
                    subjects,
                    specific_goals,
                    parent_full_name,
                    parent_email,
                    parent_phone,
                    parent_address,
                    same_as_parent,
                    emergency_name,
                    emergency_relationship,
                    emergency_phone,
                    emergency_email,
                    emergency_address,
                    learning_difficulties,
                    additional_comments,
                    how_did_you_hear,
                    liability_release,
                    registration_id,
                    price_per_lesson,
                    ten_pack_price,
                    notes,
                    created_at
                FROM registrations 
                ORDER BY student_first_name, student_last_name
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching students:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Save a lesson
    saveLesson(lessonData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO lessons (
                    student_id, student_name, title, subject,
                    start_time, end_time, duration, location,
                    description, notes, reminder, is_recurring, recurrence_type,
                    occurrence_number, total_occurrences, recurrence_group_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                lessonData.student_id,
                lessonData.student_name,
                lessonData.title,
                lessonData.subject,
                lessonData.start_time,
                lessonData.end_time,
                lessonData.duration,
                lessonData.location,
                lessonData.description || null,
                lessonData.notes || null,
                lessonData.reminder || 0,
                lessonData.is_recurring ? 1 : 0,
                lessonData.recurrence_type || null,
                lessonData.occurrence_number || null,
                lessonData.total_occurrences || null,
                lessonData.recurrence_group_id || null
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error saving lesson:', err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Get all lessons
    getAllLessons() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT * FROM lessons 
                ORDER BY start_time ASC
            `;

            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching lessons:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get lesson by ID
    getLessonById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM lessons WHERE id = ?`;

            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error fetching lesson:', err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Update a lesson
    updateLesson(id, lessonData) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE lessons 
                SET title = ?, subject = ?, start_time = ?, end_time = ?,
                    duration = ?, location = ?, description = ?, reminder = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                lessonData.title,
                lessonData.subject,
                lessonData.start_time,
                lessonData.end_time,
                lessonData.duration,
                lessonData.location,
                lessonData.description || null,
                lessonData.reminder || 0,
                id
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error updating lesson:', err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Delete a lesson
    deleteLesson(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM lessons WHERE id = ?`;

            this.db.run(sql, [id], function(err) {
                if (err) {
                    console.error('Error deleting lesson:', err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Delete all lessons in a recurring group
    deleteRecurringGroup(groupId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM lessons WHERE recurrence_group_id = ?`;

            this.db.run(sql, [groupId], function(err) {
                if (err) {
                    console.error('Error deleting recurring lessons:', err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Update student information
    updateStudent(studentId, updateData) {
        return new Promise((resolve, reject) => {
            const fields = [];
            const values = [];

            // List of all updatable fields
            const updatableFields = [
                'student_first_name', 'student_last_name', 'student_phone', 'student_email',
                'student_date_of_birth', 'student_grade', 'school_name',
                'parent_full_name', 'parent_email', 'parent_phone', 'parent_address',
                'subjects', 'specific_goals', 'learning_difficulties', 'additional_comments',
                'emergency_name', 'emergency_relationship', 'emergency_phone', 'emergency_email', 'emergency_address',
                'how_did_you_hear', 'price_per_lesson', 'ten_pack_price', 'notes'
            ];

            // Build dynamic update query
            updatableFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            });

            if (fields.length === 0) {
                resolve({ changes: 0 });
                return;
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(studentId);

            const sql = `UPDATE registrations SET ${fields.join(', ')} WHERE id = ?`;

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('Error updating student:', err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }
}

module.exports = new Database();
