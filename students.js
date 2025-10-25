// Students Manager - Display and manage registered students
class StudentsManager {
    constructor() {
        this.students = [];
        this.filteredStudents = [];
        this.selectedStudent = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadStudents();
    }

    async loadStudents() {
        this.showLoading(true);
        
        try {
            const response = await fetch('/api/students');
            const result = await response.json();
            
            if (result.success) {
                this.students = result.students;
                this.filteredStudents = [...this.students];
                this.populateSubjectFilter();
                this.renderStudents();
            } else {
                console.error('Failed to load students:', result.message);
                this.showError('Failed to load students. Please refresh the page.');
            }
        } catch (error) {
            console.error('Error loading students:', error);
            this.showError('Error loading students. Please check your connection.');
        } finally {
            this.showLoading(false);
        }
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Clear search button
        document.getElementById('clearSearch').addEventListener('click', () => {
            searchInput.value = '';
            this.handleSearch('');
        });

        // Filter dropdowns
        document.getElementById('gradeFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('subjectFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBy').addEventListener('change', () => this.applyFilters());

        // Reset filters button
        document.getElementById('resetFilters').addEventListener('click', () => this.resetFilters());
    }

    populateSubjectFilter() {
        const subjectFilter = document.getElementById('subjectFilter');
        const subjects = new Set();
        
        this.students.forEach(student => {
            if (student.subjects) {
                // Split subjects by comma and add each one
                student.subjects.split(',').forEach(subject => {
                    subjects.add(subject.trim());
                });
            }
        });

        // Clear existing options except "All Subjects"
        subjectFilter.innerHTML = '<option value="">All Subjects</option>';
        
        // Add unique subjects
        Array.from(subjects).sort().forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option);
        });
    }

    handleSearch(searchTerm) {
        const clearBtn = document.getElementById('clearSearch');
        clearBtn.style.display = searchTerm ? 'block' : 'none';
        
        this.applyFilters();
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const gradeFilter = document.getElementById('gradeFilter').value;
        const subjectFilter = document.getElementById('subjectFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        this.filteredStudents = this.students.filter(student => {
            // Search filter
            const matchesSearch = !searchTerm || 
                student.student_first_name.toLowerCase().includes(searchTerm) ||
                student.student_last_name.toLowerCase().includes(searchTerm) ||
                student.school_name.toLowerCase().includes(searchTerm) ||
                student.subjects.toLowerCase().includes(searchTerm);

            // Grade filter
            const matchesGrade = !gradeFilter || student.student_grade === gradeFilter;

            // Subject filter
            const matchesSubject = !subjectFilter || 
                student.subjects.toLowerCase().includes(subjectFilter.toLowerCase());

            return matchesSearch && matchesGrade && matchesSubject;
        });

        // Sort students
        this.sortStudents(sortBy);
        
        this.renderStudents();
    }

    sortStudents(sortBy) {
        this.filteredStudents.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return `${a.student_first_name} ${a.student_last_name}`.localeCompare(`${b.student_first_name} ${b.student_last_name}`);
                case 'name-desc':
                    return `${b.student_first_name} ${b.student_last_name}`.localeCompare(`${a.student_first_name} ${a.student_last_name}`);
                case 'grade':
                    return parseInt(a.student_grade) - parseInt(b.student_grade);
                case 'grade-desc':
                    return parseInt(b.student_grade) - parseInt(a.student_grade);
                case 'date':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'date-desc':
                    return new Date(a.created_at) - new Date(b.created_at);
                default:
                    return 0;
            }
        });
    }

    resetFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('gradeFilter').value = '';
        document.getElementById('subjectFilter').value = '';
        document.getElementById('sortBy').value = 'name';
        document.getElementById('clearSearch').style.display = 'none';
        
        this.filteredStudents = [...this.students];
        this.sortStudents('name');
        this.renderStudents();
    }

    renderStudents() {
        const list = document.getElementById('studentsList');
        const noResults = document.getElementById('noResults');

        if (this.filteredStudents.length === 0) {
            list.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        list.innerHTML = '';

        this.filteredStudents.forEach(student => {
            const listItem = this.createStudentListItem(student);
            list.appendChild(listItem);
        });
    }

    createStudentListItem(student) {
        const listItem = document.createElement('div');
        listItem.className = 'student-list-item';
        
        const registrationDate = new Date(student.created_at);
        const daysSinceRegistration = Math.floor((new Date() - registrationDate) / (1000 * 60 * 60 * 24));
        
        listItem.innerHTML = `
            <div class="student-info">
                <h3 class="student-name">${student.student_first_name} ${student.student_last_name}</h3>
            </div>
            <div class="student-actions">
                <button class="btn btn-outline" onclick="window.studentsManager.viewStudent(${student.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-primary" onclick="window.studentsManager.scheduleLessonForStudent(${student.id})">
                    <i class="fas fa-calendar-plus"></i> Schedule
                </button>
            </div>
        `;

        return listItem;
    }

    viewStudent(studentId) {
        const student = this.students.find(s => s.id == studentId);
        if (!student) return;

        this.selectedStudent = student;
        this.showStudentModal(student);
    }

    showStudentModal(student) {
        const modal = document.getElementById('studentModal');
        const modalBody = document.getElementById('modalBody');

        const registrationDate = new Date(student.created_at);
        const parentInfo = this.formatParentInfo(student);

        modalBody.innerHTML = `
            <div class="student-detail">
                <div class="detail-section">
                    <h4><i class="fas fa-user-graduate"></i> Student Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Full Name:</label>
                            <span>${student.student_first_name} ${student.student_last_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Grade:</label>
                            <span>Grade ${student.student_grade}</span>
                        </div>
                        <div class="detail-item">
                            <label>School:</label>
                            <span>${student.school_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Date of Birth:</label>
                            <span>${student.student_date_of_birth || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${student.student_phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${student.student_email || 'Not provided'}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> Parent/Guardian Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Parent Name:</label>
                            <span>${student.parent_full_name}</span>
                        </div>
                        <div class="detail-item">
                            <label>Parent Email:</label>
                            <span>${student.parent_email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Parent Phone:</label>
                            <span>${student.parent_phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${student.parent_address}</span>
                        </div>
                    </div>
                </div>

        <div class="detail-section">
            <h4><i class="fas fa-book"></i> Academic Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Subjects of Interest:</label>
                    <span>${student.subjects}</span>
                </div>
                <div class="detail-item">
                    <label>Specific Goals:</label>
                    <span>${student.specific_goals}</span>
                </div>
                ${student.learning_difficulties ? `
                <div class="detail-item">
                    <label>Learning Difficulties:</label>
                    <span>${student.learning_difficulties}</span>
                </div>
                ` : ''}
                ${student.additional_comments ? `
                <div class="detail-item">
                    <label>Additional Comments:</label>
                    <span>${student.additional_comments}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="fas fa-dollar-sign"></i> Pricing Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Price per Lesson:</label>
                    <span>$${student.price_per_lesson || '0.00'}</span>
                </div>
                <div class="detail-item">
                    <label>10 Pack Price:</label>
                    <span>$${student.ten_pack_price || '0.00'}</span>
                </div>
            </div>
        </div>

        ${student.notes ? `
        <div class="detail-section">
            <h4><i class="fas fa-sticky-note"></i> Admin Notes</h4>
            <div class="detail-item">
                <span>${student.notes}</span>
            </div>
        </div>
        ` : ''}

                <div class="detail-section">
                    <h4><i class="fas fa-phone-alt"></i> Emergency Contact</h4>
                    <div class="detail-grid">
                        ${student.same_as_parent == '1' ? `
                        <div class="detail-item">
                            <label>Emergency Contact:</label>
                            <span>${student.parent_full_name} <em>(Same as Parent)</em></span>
                        </div>
                        <div class="detail-item">
                            <label>Relationship:</label>
                            <span>Parent/Guardian</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Phone:</label>
                            <span>${student.parent_phone}</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Email:</label>
                            <span>${student.parent_email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Address:</label>
                            <span>${student.parent_address}</span>
                        </div>
                        ` : `
                        <div class="detail-item">
                            <label>Emergency Contact:</label>
                            <span>${student.emergency_name || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Relationship:</label>
                            <span>${student.emergency_relationship || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Phone:</label>
                            <span>${student.emergency_phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Email:</label>
                            <span>${student.emergency_email || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Emergency Address:</label>
                            <span>${student.emergency_address || 'Not provided'}</span>
                        </div>
                        `}
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Registration Details</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Registration Date:</label>
                            <span>${this.formatDate(registrationDate)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Liability Release:</label>
                            <span class="status-badge ${student.liability_release == 1 ? 'approved' : 'pending'}">
                                ${student.liability_release == 1 ? 'Agreed' : 'Pending'}
                            </span>
                        </div>
                        ${student.how_did_you_hear ? `
                        <div class="detail-item">
                            <label>How did you hear about us:</label>
                            <span>${student.how_did_you_hear}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    scheduleLessonForStudent(studentId) {
        // Redirect to lesson scheduler with pre-selected student
        window.location.href = `lesson-scheduler.html?student=${studentId}`;
    }

    editStudent() {
        console.log('StudentsManager.editStudent called');
        console.log('selectedStudent:', this.selectedStudent);
        
        if (!this.selectedStudent) {
            console.error('No student selected');
            alert('Error: No student selected');
            return;
        }
        
        const student = this.selectedStudent;
        
        // Create edit modal HTML
        const editModalHTML = `
            <div id="editStudentModal" class="modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-edit"></i> Edit Student Information</h3>
                        <button class="close-btn" onclick="closeEditStudentModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="editStudentForm">
                            <div class="form-group">
                                <label for="editPricePerLesson">Price per Lesson ($)</label>
                                <input type="number" id="editPricePerLesson" name="price_per_lesson" 
                                       value="${student.price_per_lesson || 0}" step="0.01" min="0">
                            </div>
                            <div class="form-group">
                                <label for="editTenPackPrice">10 Pack Price ($)</label>
                                <input type="number" id="editTenPackPrice" name="ten_pack_price" 
                                       value="${student.ten_pack_price || 0}" step="0.01" min="0">
                            </div>
                            <div class="form-group">
                                <label for="editNotes">Admin Notes</label>
                                <textarea id="editNotes" name="notes" rows="4" 
                                          placeholder="Add notes about this student...">${student.notes || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeEditStudentModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="saveStudentChanges()">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', editModalHTML);
        console.log('Edit modal added to page');
        
        // Verify modal was added
        const modal = document.getElementById('editStudentModal');
        console.log('Modal element:', modal);
        if (modal) {
            console.log('Modal display style:', modal.style.display);
        }
    }


    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    formatParentInfo(student) {
        return `${student.parent_full_name} (${student.parent_email})`;
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const list = document.getElementById('studentsList');
        
        if (show) {
            spinner.style.display = 'block';
            list.style.display = 'none';
        } else {
            spinner.style.display = 'none';
            list.style.display = 'block';
        }
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
function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
}

function scheduleLesson() {
    if (window.studentsManager.selectedStudent) {
        window.studentsManager.scheduleLessonForStudent(window.studentsManager.selectedStudent.id);
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('studentModal');
    if (e.target === modal) {
        closeStudentModal();
    }
});

// Initialize students manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.studentsManager = new StudentsManager();
});

// Global functions for edit modal
function editStudent() {
    console.log('editStudent called');
    console.log('window.studentsManager:', window.studentsManager);
    console.log('selectedStudent:', window.studentsManager?.selectedStudent);
    
    if (window.studentsManager) {
        window.studentsManager.editStudent();
    } else {
        console.error('studentsManager not found');
        alert('Error: Students manager not initialized');
    }
}

function closeEditStudentModal() {
    const modal = document.getElementById('editStudentModal');
    if (modal) {
        modal.remove();
    }
}

async function saveStudentChanges() {
    if (!window.studentsManager.selectedStudent) return;
    
    const form = document.getElementById('editStudentForm');
    const formData = new FormData(form);
    
    const updateData = {
        price_per_lesson: parseFloat(formData.get('price_per_lesson')) || 0,
        ten_pack_price: parseFloat(formData.get('ten_pack_price')) || 0,
        notes: formData.get('notes') || ''
    };
    
    try {
        const response = await fetch(`/api/students/${window.studentsManager.selectedStudent.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the selected student data
            window.studentsManager.selectedStudent.price_per_lesson = updateData.price_per_lesson;
            window.studentsManager.selectedStudent.ten_pack_price = updateData.ten_pack_price;
            window.studentsManager.selectedStudent.notes = updateData.notes;
            
            // Refresh the student details modal
            window.studentsManager.showStudentDetails(window.studentsManager.selectedStudent);
            
            // Close edit modal
            closeEditStudentModal();
            
            alert('Student information updated successfully!');
        } else {
            alert('Failed to update student: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Error updating student. Please try again.');
    }
}
