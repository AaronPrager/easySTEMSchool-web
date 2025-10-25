// Reports Page - Lesson Report Generation
class ReportsManager {
    constructor() {
        this.students = [];
        this.lessons = [];
        this.init();
    }

    init() {
        this.loadStudents();
        this.loadLessons();
        this.bindEvents();
        this.setDefaultDates();
    }

    async loadStudents() {
        try {
            const response = await fetch('/api/students');
            const result = await response.json();
            
            if (result.success) {
                this.students = result.students;
                this.populateStudentFilter();
            } else {
                console.error('Failed to load students:', result.message);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    async loadLessons() {
        try {
            const response = await fetch('/api/lessons');
            const result = await response.json();
            
            if (result.success) {
                this.lessons = result.lessons;
                this.populateSubjectFilter();
            } else {
                console.error('Failed to load lessons:', result.message);
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
        }
    }

    populateStudentFilter() {
        const select = document.getElementById('studentFilter');
        
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.student_first_name} ${student.student_last_name}`;
            select.appendChild(option);
        });
    }

    populateSubjectFilter() {
        const select = document.getElementById('subjectFilter');
        const subjects = new Set();
        
        this.lessons.forEach(lesson => {
            if (lesson.subject) {
                subjects.add(lesson.subject);
            }
        });
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            select.appendChild(option);
        });
    }

    setDefaultDates() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        document.getElementById('startDate').value = startOfMonth.toISOString().split('T')[0];
        document.getElementById('endDate').value = endOfMonth.toISOString().split('T')[0];
    }

    bindEvents() {
        // Auto-generate report when filters change
        document.getElementById('startDate').addEventListener('change', () => this.generateReport());
        document.getElementById('endDate').addEventListener('change', () => this.generateReport());
        document.getElementById('studentFilter').addEventListener('change', () => this.generateReport());
        document.getElementById('subjectFilter').addEventListener('change', () => this.generateReport());
    }

    generateReport() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const studentId = document.getElementById('studentFilter').value;
        const subject = document.getElementById('subjectFilter').value;

        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        this.showLoading(true);
        
        // Filter lessons based on criteria
        const filteredLessons = this.filterLessons(startDate, endDate, studentId, subject);
        
        // Generate report content
        this.renderReport(filteredLessons, startDate, endDate, studentId, subject);
        
        this.showLoading(false);
        this.showReportResults(true);
    }

    filterLessons(startDate, endDate, studentId, subject) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire end date

        return this.lessons.filter(lesson => {
            const lessonDate = new Date(lesson.start_time);
            
            // Date range filter
            if (lessonDate < start || lessonDate > end) {
                return false;
            }
            
            // Student filter
            if (studentId && lesson.student_id != studentId) {
                return false;
            }
            
            // Subject filter
            if (subject && lesson.subject !== subject) {
                return false;
            }
            
            return true;
        });
    }

    renderReport(lessons, startDate, endDate, studentId, subject) {
        const reportContent = document.getElementById('reportContent');
        
        // Sort lessons by date and time
        lessons.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
        // Get report title and summary
        const reportTitle = this.getReportTitle(studentId, subject);
        const summary = this.getReportSummary(lessons, startDate, endDate);
        
        let html = `
            <div class="report-summary">
                <h4>${reportTitle}</h4>
                <p><strong>Date Range:</strong> ${this.formatDateRange(startDate, endDate)}</p>
                ${summary}
            </div>
            
            <div class="lessons-table">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Student</th>
                            <th>Subject</th>
                            <th>Duration</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (lessons.length === 0) {
            html += `
                <tr>
                    <td colspan="6" class="no-data">No lessons found for the selected criteria</td>
                </tr>
            `;
        } else {
            lessons.forEach(lesson => {
                const startTime = new Date(lesson.start_time);
                const endTime = new Date(lesson.end_time);
                
                html += `
                    <tr>
                        <td>${this.formatDate(startTime)}</td>
                        <td>${this.formatTime(startTime)} - ${this.formatTime(endTime)}</td>
                        <td>${lesson.student_name}</td>
                        <td>${lesson.subject}</td>
                        <td>${lesson.duration} min</td>
                        <td>${lesson.description || '-'}</td>
                    </tr>
                `;
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        reportContent.innerHTML = html;
    }

    getReportTitle(studentId, subject) {
        let title = 'Lesson Report';
        
        if (studentId) {
            const student = this.students.find(s => s.id == studentId);
            if (student) {
                title = `Lesson Report - ${student.student_first_name} ${student.student_last_name}`;
            }
        }
        
        if (subject) {
            title += ` - ${subject}`;
        }
        
        return title;
    }

    getReportSummary(lessons, startDate, endDate) {
        const totalLessons = lessons.length;
        const totalDuration = lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
        const totalHours = Math.round(totalDuration / 60 * 10) / 10;
        
        // Count by subject
        const subjectCounts = {};
        lessons.forEach(lesson => {
            subjectCounts[lesson.subject] = (subjectCounts[lesson.subject] || 0) + 1;
        });
        
        let summary = `
            <div class="summary-stats">
                <div class="stat-item">
                    <span class="stat-number">${totalLessons}</span>
                    <span class="stat-label">Total Lessons</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalHours}h</span>
                    <span class="stat-label">Total Hours</span>
                </div>
            </div>
        `;
        
        if (Object.keys(subjectCounts).length > 1) {
            summary += '<div class="summary-breakdown"><strong>By Subject:</strong> ';
            summary += Object.entries(subjectCounts)
                .map(([subject, count]) => `${subject} (${count})`)
                .join(', ');
            summary += '</div>';
        }
        
        return summary;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start.toDateString() === end.toDateString()) {
            return this.formatDate(start);
        }
        
        return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'flex' : 'none';
    }

    showReportResults(show) {
        const results = document.getElementById('reportResults');
        results.style.display = show ? 'block' : 'none';
    }

    clearFilters() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('studentFilter').value = '';
        document.getElementById('subjectFilter').value = '';
        
        this.showReportResults(false);
        this.setDefaultDates();
    }

    setDateRange(range) {
        const today = new Date();
        let startDate, endDate;

        switch (range) {
            case 'lastWeek':
                // Last week (Monday to Sunday of previous week)
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(today.getDate() - today.getDay() - 6); // Previous Monday
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6); // Previous Sunday
                startDate = lastWeekStart;
                endDate = lastWeekEnd;
                break;

            case 'lastMonth':
                // Last month
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                startDate = lastMonthStart;
                endDate = lastMonthEnd;
                break;

            case 'thisMonth':
                // This month
                const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDate = thisMonthStart;
                endDate = thisMonthEnd;
                break;

            default:
                return;
        }

        // Set the date inputs
        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

        // Auto-generate report
        this.generateReport();
    }
}

// Global functions for buttons
function generateReport() {
    if (window.reportsManager) {
        window.reportsManager.generateReport();
    }
}

function clearFilters() {
    if (window.reportsManager) {
        window.reportsManager.clearFilters();
    }
}

function setDateRange(range) {
    if (window.reportsManager) {
        window.reportsManager.setDateRange(range);
    }
}

function printReport() {
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Lesson Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .report-summary { margin-bottom: 20px; }
                        .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        .report-table th { background-color: #f2f2f2; }
                        .summary-stats { display: flex; gap: 20px; margin: 10px 0; }
                        .stat-item { text-align: center; }
                        .stat-number { display: block; font-size: 1.5em; font-weight: bold; }
                        .stat-label { font-size: 0.9em; color: #666; }
                        .summary-breakdown { margin: 10px 0; }
                        @media print {
                            body { margin: 0; }
                            .report-table { font-size: 12px; }
                        }
                    </style>
                </head>
                <body>
                    <h2>Easy STEM School - Lesson Report</h2>
                    ${reportContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function exportReport() {
    alert('PDF export functionality will be implemented in a future update.');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new ReportsManager();
});
