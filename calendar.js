// Calendar Manager - Display and manage lessons
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.lessons = [];
        this.selectedLesson = null;
        this.init();
    }

    async init() {
        await this.loadLessons();
        this.bindEvents();
        this.renderCalendar();
    }

    async loadLessons() {
        try {
            const response = await fetch('/api/lessons');
            const result = await response.json();
            
            if (result.success) {
                this.lessons = result.lessons.map(lesson => ({
                    ...lesson,
                    start: new Date(lesson.start_time),
                    end: new Date(lesson.end_time)
                }));
                this.renderCalendar();
            } else {
                console.error('Failed to load lessons:', result.message);
            }
        } catch (error) {
            console.error('Error loading lessons:', error);
            this.showError('Failed to load lessons. Please refresh the page.');
        }
    }

    bindEvents() {
        // View selector
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.closest('.view-btn').classList.add('active');
                this.currentView = e.target.closest('.view-btn').dataset.view;
                this.renderCalendar();
            });
        });

        // Navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.navigate(-1));
        document.getElementById('nextBtn').addEventListener('click', () => this.navigate(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());
    }

    navigate(direction) {
        switch (this.currentView) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (7 * direction));
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + direction);
                break;
        }
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        // Hide all views
        document.querySelectorAll('.calendar-view').forEach(view => {
            view.classList.remove('active');
        });

        // Show current view
        switch (this.currentView) {
            case 'month':
                document.getElementById('monthView').classList.add('active');
                this.renderMonthView();
                break;
            case 'week':
                document.getElementById('weekView').classList.add('active');
                this.renderWeekView();
                break;
            case 'day':
                document.getElementById('dayView').classList.add('active');
                this.renderDayView();
                break;
        }

        this.updatePeriodLabel();
    }

    updatePeriodLabel() {
        const label = document.getElementById('currentPeriod');
        const options = { year: 'numeric', month: 'long' };
        
        switch (this.currentView) {
            case 'month':
                label.textContent = this.currentDate.toLocaleDateString('en-US', options);
                break;
            case 'week':
                const weekStart = this.getWeekStart(this.currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                label.textContent = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'day':
                label.textContent = this.currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                break;
        }
    }

    renderMonthView() {
        const grid = document.getElementById('monthGrid');
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            if (currentDate.getMonth() !== month) {
                dayCell.classList.add('other-month');
            }
            
            if (currentDate.getTime() === today.getTime()) {
                dayCell.classList.add('today');
            }

            dayCell.innerHTML = `<div class="day-number">${currentDate.getDate()}</div>`;

            // Add lessons for this day
            const dayLessons = this.getLessonsForDate(currentDate);
            if (dayLessons.length > 0) {
                const lessonsContainer = document.createElement('div');
                lessonsContainer.className = 'day-lessons';
                
                dayLessons.forEach(lesson => {
                    const lessonEl = document.createElement('div');
                    lessonEl.className = `lesson-item ${this.getLessonClass(lesson)}`;
                    lessonEl.textContent = `${this.formatTime(lesson.start)} - ${lesson.title}`;
                    lessonEl.onclick = () => this.showLessonDetails(lesson);
                    lessonsContainer.appendChild(lessonEl);
                });

                dayCell.appendChild(lessonsContainer);
            }

            grid.appendChild(dayCell);
        }
    }

    renderWeekView() {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = document.getElementById('weekDays');
        weekDays.innerHTML = '';

        // Generate day headers
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            
            const isToday = this.isToday(day);
            if (isToday) {
                dayHeader.classList.add('today');
            }
            
            dayHeader.innerHTML = `
                <div class="day-name">${day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div class="day-date">${day.getDate()}</div>
            `;
            weekDays.appendChild(dayHeader);
        }

        // Generate time slots
        const weekGrid = document.getElementById('weekGrid');
        weekGrid.innerHTML = '';

        for (let hour = 8; hour < 21; hour++) {
            const row = document.createElement('div');
            row.className = 'week-row';

            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = this.formatHour(hour);
            row.appendChild(timeLabel);

            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'week-slots';

            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                day.setHours(hour, 0, 0, 0);

                const slot = document.createElement('div');
                slot.className = 'time-slot';

                // Find lessons in this time slot
                const slotLessons = this.getLessonsForHour(day, hour);
                slotLessons.forEach(lesson => {
                    const lessonEl = document.createElement('div');
                    lessonEl.className = `lesson-block ${this.getLessonClass(lesson)}`;
                    lessonEl.innerHTML = `
                        <strong>${lesson.title}</strong><br>
                        <small>${this.formatTime(lesson.start)} - ${this.formatTime(lesson.end)}</small><br>
                        <small>${lesson.student_name}</small>
                    `;
                    lessonEl.onclick = () => this.showLessonDetails(lesson);
                    slot.appendChild(lessonEl);
                });

                slotsContainer.appendChild(slot);
            }

            row.appendChild(slotsContainer);
            weekGrid.appendChild(row);
        }
    }

    renderDayView() {
        const dayTitle = document.getElementById('dayTitle');
        dayTitle.textContent = this.currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        const dayGrid = document.getElementById('dayGrid');
        dayGrid.innerHTML = '';

        const dayLessons = this.getLessonsForDate(this.currentDate);

        for (let hour = 8; hour < 21; hour++) {
            const row = document.createElement('div');
            row.className = 'day-row';

            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = this.formatHour(hour);
            row.appendChild(timeLabel);

            const slot = document.createElement('div');
            slot.className = 'time-slot-wide';

            // Find lessons in this hour
            const hourLessons = dayLessons.filter(lesson => lesson.start.getHours() === hour);
            hourLessons.forEach(lesson => {
                const lessonEl = document.createElement('div');
                lessonEl.className = `lesson-block-wide ${this.getLessonClass(lesson)}`;
                lessonEl.innerHTML = `
                    <div class="lesson-time">${this.formatTime(lesson.start)} - ${this.formatTime(lesson.end)}</div>
                    <div class="lesson-title">${lesson.title}</div>
                    <div class="lesson-student">${lesson.student_name}</div>
                    <div class="lesson-subject">${lesson.subject}</div>
                    <div class="lesson-location"><i class="fas fa-map-marker-alt"></i> ${lesson.location}</div>
                `;
                lessonEl.onclick = () => this.showLessonDetails(lesson);
                slot.appendChild(lessonEl);
            });

            row.appendChild(slot);
            dayGrid.appendChild(row);
        }

        if (dayLessons.length === 0) {
            dayGrid.innerHTML = '<div class="no-lessons"><i class="fas fa-calendar-times"></i><p>No lessons scheduled for this day</p></div>';
        }
    }

    getLessonsForDate(date) {
        const dateStr = date.toDateString();
        return this.lessons.filter(lesson => lesson.start.toDateString() === dateStr);
    }

    getLessonsForHour(date, hour) {
        return this.lessons.filter(lesson => {
            return lesson.start.toDateString() === date.toDateString() &&
                   lesson.start.getHours() === hour;
        });
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    formatHour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    }

    getLessonClass(lesson) {
        let className = '';
        if (lesson.location === 'Online') {
            className += 'online ';
        } else {
            className += 'in-person ';
        }
        if (lesson.is_recurring) {
            className += 'recurring';
        }
        return className;
    }

    showLessonDetails(lesson) {
        this.selectedLesson = lesson;
        const modal = document.getElementById('lessonModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <div class="lesson-details">
                <div class="detail-row">
                    <i class="fas fa-user-graduate"></i>
                    <div>
                        <strong>Student:</strong><br>
                        ${lesson.student_name}
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-book"></i>
                    <div>
                        <strong>Subject:</strong><br>
                        ${lesson.subject}
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <strong>Date:</strong><br>
                        ${lesson.start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-clock"></i>
                    <div>
                        <strong>Time:</strong><br>
                        ${this.formatTime(lesson.start)} - ${this.formatTime(lesson.end)}
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-hourglass-half"></i>
                    <div>
                        <strong>Duration:</strong><br>
                        ${lesson.duration} minutes
                    </div>
                </div>
                <div class="detail-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <strong>Location:</strong><br>
                        ${lesson.location}
                    </div>
                </div>
                ${lesson.description ? `
                <div class="detail-row">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Description:</strong><br>
                        ${lesson.description}
                    </div>
                </div>
                ` : ''}
                ${lesson.notes ? `
                <div class="detail-row">
                    <i class="fas fa-sticky-note"></i>
                    <div>
                        <strong>Notes:</strong><br>
                        ${lesson.notes}
                    </div>
                </div>
                ` : ''}
                ${lesson.is_recurring ? `
                <div class="detail-row recurring-badge">
                    <i class="fas fa-repeat"></i>
                    <div>
                        <strong>Recurring Lesson</strong><br>
                        ${lesson.recurrence_type} (${lesson.occurrence_number}/${lesson.total_occurrences})
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'flex';
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

// Modal functions
function closeModal() {
    document.getElementById('lessonModal').style.display = 'none';
}

function showDeleteOptions() {
    if (!window.calendarManager.selectedLesson) return;
    
    const deleteOptionsModal = document.getElementById('deleteOptionsModal');
    deleteOptionsModal.style.display = 'flex';
}

function closeDeleteOptionsModal() {
    const deleteOptionsModal = document.getElementById('deleteOptionsModal');
    deleteOptionsModal.style.display = 'none';
}

async function deleteSingleLesson() {
    if (!window.calendarManager.selectedLesson) return;

    try {
        const response = await fetch(`/api/lessons/${window.calendarManager.selectedLesson.id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            closeDeleteOptionsModal();
            closeModal();
            await window.calendarManager.loadLessons();
        } else {
            alert('Failed to delete lesson: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Error deleting lesson. Please try again.');
    }
}

async function deleteAllInSeries() {
    if (!window.calendarManager.selectedLesson) return;
    
    if (!window.calendarManager.selectedLesson.is_recurring) {
        alert('This lesson is not part of a recurring series.');
        return;
    }

    try {
        const response = await fetch(`/api/lessons/${window.calendarManager.selectedLesson.id}?deleteAll=true`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
            closeDeleteOptionsModal();
            closeModal();
            await window.calendarManager.loadLessons();
        } else {
            alert('Failed to delete series: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting series:', error);
        alert('Error deleting series. Please try again.');
    }
}

function editLesson() {
    if (!window.calendarManager.selectedLesson) return;
    
    // Redirect to scheduler with lesson ID for editing
    window.location.href = `lesson-scheduler.html?edit=${window.calendarManager.selectedLesson.id}`;
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('lessonModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.calendarManager = new CalendarManager();
});
