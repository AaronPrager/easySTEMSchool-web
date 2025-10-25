// Lesson Scheduler - Student Selection and Calendar Integration
class LessonScheduler {
    constructor() {
        this.students = [];
        this.init();
    }

    init() {
        this.loadStudents();
        this.bindEvents();
        this.setDefaultDate();
        this.handleUrlParameters();
    }

    async loadStudents() {
        try {
            const response = await fetch('/api/students');
            const result = await response.json();
            
            if (result.success) {
                this.students = result.students;
                this.populateStudentSelect();
            } else {
                console.error('Failed to load students:', result.message);
                this.showError('Failed to load students. Please refresh the page.');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Error loading students. Please check your connection.');
        }
    }

    populateStudentSelect() {
        const select = document.getElementById('studentSelect');
        select.innerHTML = '<option value="">Select a student...</option>';
        
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.student_first_name} ${student.student_last_name} (Grade ${student.student_grade})`;
            select.appendChild(option);
        });
    }

    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('student');
        
        if (studentId) {
            // Wait for students to be loaded, then pre-select
            const checkStudents = () => {
                if (this.students.length > 0) {
                    this.preSelectStudent(studentId);
                } else {
                    // If students not loaded yet, wait a bit and try again
                    setTimeout(checkStudents, 100);
                }
            };
            checkStudents();
        }
    }

    preSelectStudent(studentId) {
        const select = document.getElementById('studentSelect');
        const studentInfo = document.getElementById('studentInfo');
        const student = this.students.find(s => s.id == studentId);
        
        if (student) {
            select.value = studentId;
            // Hide student info section when pre-selected from URL
            studentInfo.style.display = 'none';
        } else {
            console.warn('Student with ID', studentId, 'not found');
        }
    }

    bindEvents() {
        const form = document.getElementById('lessonForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Student selection change
        document.getElementById('studentSelect').addEventListener('change', (e) => {
            const studentInfo = document.getElementById('studentInfo');
            if (e.target.value) {
                // Show student info when manually selecting a student
                studentInfo.style.display = 'block';
                this.showStudentInfo(e.target.value);
            } else {
                // Hide student info when no student selected
                studentInfo.style.display = 'none';
            }
        });

        // Recurring checkbox
        document.getElementById('isRecurring').addEventListener('change', (e) => {
            const recurringOptions = document.getElementById('recurringOptions');
            recurringOptions.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    setDefaultDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        document.getElementById('lessonDate').value = tomorrow.toISOString().split('T')[0];
        document.getElementById('lessonTime').value = '15:00'; // Default to 3 PM
    }

    showStudentInfo(studentId) {
        const studentInfo = document.getElementById('studentInfo');
        const studentDetails = document.getElementById('studentDetails');
        
        if (!studentId) {
            studentInfo.style.display = 'none';
            return;
        }

        const student = this.students.find(s => s.id == studentId);
        if (student) {
            studentDetails.innerHTML = `
                <div class="student-card">
                    <p><strong>Name:</strong> ${student.student_first_name} ${student.student_last_name}</p>
                    <p><strong>Grade:</strong> ${student.student_grade}</p>
                    <p><strong>School:</strong> ${student.school_name}</p>
                    <p><strong>Phone:</strong> ${student.student_phone}</p>
                    <p><strong>Email:</strong> ${student.student_email || 'Not provided'}</p>
                    <p><strong>Subjects:</strong> ${student.subjects}</p>
                    <p><strong>Goals:</strong> ${student.specific_goals}</p>
                </div>
            `;
            studentInfo.style.display = 'block';
            
            // Auto-fill lesson subject if available
            if (student.subjects) {
                document.getElementById('lessonSubject').value = student.subjects;
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const lessonData = this.collectLessonData();
        if (this.validateLessonData(lessonData)) {
            await this.generateAndDownloadICS(lessonData);
        }
    }

    collectLessonData() {
        const studentId = document.getElementById('studentSelect').value;
        const student = this.students.find(s => s.id == studentId);
        
        return {
            student: student,
            title: document.getElementById('lessonTitle').value.trim(),
            date: document.getElementById('lessonDate').value,
            time: document.getElementById('lessonTime').value,
            duration: parseInt(document.getElementById('lessonDuration').value),
            location: document.getElementById('lessonLocation').value,
            subject: document.getElementById('lessonSubject').value.trim(),
            description: document.getElementById('lessonDescription').value.trim(),
            reminder: parseInt(document.getElementById('lessonReminder').value),
            isRecurring: document.getElementById('isRecurring').checked,
            recurrenceType: document.getElementById('recurrenceType').value,
            recurrenceCount: parseInt(document.getElementById('recurrenceCount').value)
        };
    }

    validateLessonData(data) {
        if (!data.student) {
            alert('Please select a student');
            return false;
        }
        if (!data.title) {
            alert('Please enter a lesson title');
            return false;
        }
        if (!data.subject) {
            alert('Please enter a subject');
            return false;
        }
        if (!data.date) {
            alert('Please select a date');
            return false;
        }
        if (!data.time) {
            alert('Please select a time');
            return false;
        }
        return true;
    }

    async generateAndDownloadICS(lessonData) {
        // First, save to database
        await this.saveLessonToDatabase(lessonData);
        
        // Then generate and download ICS
        const icsContent = this.generateICSContent(lessonData);
        const filename = `${lessonData.student.student_first_name}_${lessonData.student.student_last_name}_${lessonData.subject.replace(/[^a-z0-9]/gi, '_')}`;
        
        this.downloadICS(icsContent, filename);
        this.showSuccessMessage(lessonData);
    }

    async saveLessonToDatabase(lessonData) {
        try {
            const startDateTime = this.createDateTime(lessonData.date, lessonData.time);
            const endDateTime = this.addMinutes(startDateTime, lessonData.duration);

            const dbLesson = {
                student_id: lessonData.student.id,
                student_name: `${lessonData.student.student_first_name} ${lessonData.student.student_last_name}`,
                title: lessonData.title,
                subject: lessonData.subject,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                duration: lessonData.duration,
                location: lessonData.location,
                description: lessonData.description,
                reminder: lessonData.reminder,
                is_recurring: lessonData.isRecurring
            };

            // If recurring, add recurrence data
            if (lessonData.isRecurring) {
                dbLesson.recurrenceData = {
                    recurrenceType: lessonData.recurrenceType,
                    recurrenceCount: lessonData.recurrenceCount
                };
            }

            const response = await fetch('/api/lessons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dbLesson)
            });

            const result = await response.json();

            if (!result.success) {
                console.error('Failed to save lesson to database:', result.message);
                // Continue anyway - at least they have the ICS file
            }
        } catch (error) {
            console.error('Error saving lesson to database:', error);
            // Continue anyway - at least they have the ICS file
        }
    }

    generateICSContent(lessonData) {
        const startDateTime = this.createDateTime(lessonData.date, lessonData.time);
        const endDateTime = this.addMinutes(startDateTime, lessonData.duration);
        
        const startUTC = this.toUTCString(startDateTime);
        const endUTC = this.toUTCString(endDateTime);
        const nowUTC = this.toUTCString(new Date());

        let events = [];
        
        if (lessonData.isRecurring) {
            // Generate recurring events
            events = this.generateRecurringEvents(lessonData, startDateTime, endDateTime);
        } else {
            // Generate single event
            events = [this.generateSingleEvent(lessonData, startUTC, endUTC, nowUTC)];
        }

        // Combine all events into one calendar
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Easy STEM School//Lesson Scheduler//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        events.forEach(event => {
            icsContent.push(...event);
        });

        icsContent.push('END:VCALENDAR');

        return icsContent.join('\r\n');
    }

    generateSingleEvent(lessonData, startUTC, endUTC, nowUTC) {
        const event = [
            'BEGIN:VEVENT',
            `UID:${this.generateUID()}@easystemschool.com`,
            `DTSTAMP:${nowUTC}`,
            `DTSTART:${startUTC}`,
            `DTEND:${endUTC}`,
            `SUMMARY:${this.escapeICS(lessonData.title)}`,
            `DESCRIPTION:${this.escapeICS(this.formatDescription(lessonData))}`,
            `LOCATION:${this.escapeICS(lessonData.location)}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE'
        ];

        // Add reminder if specified
        if (lessonData.reminder > 0) {
            event.push(
                'BEGIN:VALARM',
                'ACTION:DISPLAY',
                `TRIGGER:-PT${lessonData.reminder}M`,
                `DESCRIPTION:${this.escapeICS(lessonData.title)}`,
                'END:VALARM'
            );
        }

        event.push('END:VEVENT');
        return event;
    }

    generateRecurringEvents(lessonData, startDateTime, endDateTime) {
        const events = [];
        const nowUTC = this.toUTCString(new Date());
        
        for (let i = 0; i < lessonData.recurrenceCount; i++) {
            const eventStart = this.calculateRecurrenceDate(startDateTime, i, lessonData.recurrenceType);
            const eventEnd = this.addMinutes(eventStart, lessonData.duration);
            
            const startUTC = this.toUTCString(eventStart);
            const endUTC = this.toUTCString(eventEnd);
            
            const eventTitle = `${lessonData.title} (${i + 1}/${lessonData.recurrenceCount})`;
            
            const event = [
                'BEGIN:VEVENT',
                `UID:${this.generateUID()}@easystemschool.com`,
                `DTSTAMP:${nowUTC}`,
                `DTSTART:${startUTC}`,
                `DTEND:${endUTC}`,
                `SUMMARY:${this.escapeICS(eventTitle)}`,
                `DESCRIPTION:${this.escapeICS(this.formatDescription(lessonData))}`,
                `LOCATION:${this.escapeICS(lessonData.location)}`,
                'STATUS:CONFIRMED',
                'TRANSP:OPAQUE'
            ];

            // Add reminder if specified
            if (lessonData.reminder > 0) {
                event.push(
                    'BEGIN:VALARM',
                    'ACTION:DISPLAY',
                    `TRIGGER:-PT${lessonData.reminder}M`,
                    `DESCRIPTION:${this.escapeICS(eventTitle)}`,
                    'END:VALARM'
                );
            }

            event.push('END:VEVENT');
            events.push(event);
        }
        
        return events;
    }

    calculateRecurrenceDate(startDate, weekOffset, recurrenceType) {
        const date = new Date(startDate);
        
        switch (recurrenceType) {
            case 'weekly':
                date.setDate(date.getDate() + (weekOffset * 7));
                break;
            case 'biweekly':
                date.setDate(date.getDate() + (weekOffset * 14));
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + weekOffset);
                break;
        }
        
        return date;
    }

    formatDescription(lessonData) {
        let description = `Student: ${lessonData.student.student_first_name} ${lessonData.student.student_last_name}\n`;
        description += `Subject: ${lessonData.subject}\n`;
        description += `Grade: ${lessonData.student.student_grade}\n`;
        description += `School: ${lessonData.student.school_name}\n`;
        
        if (lessonData.description) {
            description += `\nLesson Details:\n${lessonData.description}`;
        }
        
        if (lessonData.student.student_phone) {
            description += `\n\nStudent Phone: ${lessonData.student.student_phone}`;
        }
        
        if (lessonData.student.student_email) {
            description += `\nStudent Email: ${lessonData.student.student_email}`;
        }
        
        return description;
    }

    createDateTime(date, time) {
        return new Date(`${date}T${time}`);
    }

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    toUTCString(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    generateUID() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeICS(text) {
        return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
    }

    downloadICS(content, filename) {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    showSuccessMessage(lessonData) {
        const message = document.createElement('div');
        message.className = 'success-notification';
        
        const lessonCount = lessonData.isRecurring ? lessonData.recurrenceCount : 1;
        const lessonType = lessonData.isRecurring ? 'recurring lessons' : 'lesson';
        
        message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${lessonCount} ${lessonType} created for ${lessonData.student.student_first_name} ${lessonData.student.student_last_name}!<br>
            <small>The .ics file has been downloaded. Double-click it to add to your calendar.</small>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(message);
            }, 300);
        }, 5000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 5000);
    }
}

// Preview functionality
function previewLesson() {
    const scheduler = window.lessonScheduler;
    const lessonData = scheduler.collectLessonData();
    
    if (!lessonData.student) {
        alert('Please select a student first');
        return;
    }
    
    const startDateTime = new Date(`${lessonData.date}T${lessonData.time}`);
    const endDateTime = new Date(startDateTime.getTime() + lessonData.duration * 60000);
    
    let previewHTML = `
        <div class="preview-lesson">
            <h4>${lessonData.title}</h4>
            <p><strong>Student:</strong> ${lessonData.student.student_first_name} ${lessonData.student.student_last_name}</p>
            <p><strong>Subject:</strong> ${lessonData.subject}</p>
            <p><strong>Date:</strong> ${startDateTime.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${startDateTime.toLocaleTimeString()} - ${endDateTime.toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${lessonData.duration} minutes</p>
            <p><strong>Location:</strong> ${lessonData.location}</p>
            <p><strong>Description:</strong> ${lessonData.description || 'No description provided'}</p>
            <p><strong>Reminder:</strong> ${lessonData.reminder > 0 ? `${lessonData.reminder} minutes before` : 'No reminder'}</p>
    `;
    
    if (lessonData.isRecurring) {
        previewHTML += `
            <p><strong>Recurring:</strong> Yes (${lessonData.recurrenceType}, ${lessonData.recurrenceCount} lessons)</p>
        `;
    } else {
        previewHTML += `<p><strong>Recurring:</strong> No</p>`;
    }
    
    previewHTML += `</div>`;
    
    document.getElementById('previewDetails').innerHTML = previewHTML;
    document.getElementById('lessonPreview').style.display = 'flex';
}

function closePreview() {
    document.getElementById('lessonPreview').style.display = 'none';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.lessonScheduler = new LessonScheduler();
});

