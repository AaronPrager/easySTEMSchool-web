// Registration Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateRegistrationForm(this)) {
                // Don't show notification, fields are already marked with red borders
                return;
            }

            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            
            submitButton.innerHTML = '<span class="loading"></span> Submitting Registration...';
            submitButton.disabled = true;

            // Get form data
            const formData = new FormData(this);
            const data = {
                // Parent/Guardian Information
                parentFirstName: formData.get('parentFirstName'),
                parentLastName: formData.get('parentLastName'),
                parentEmail: formData.get('parentEmail'),
                parentPhone: formData.get('parentPhone'),
                
                // Student Information
                studentFirstName: formData.get('studentFirstName'),
                studentLastName: formData.get('studentLastName'),
                studentEmail: formData.get('studentEmail'),
                studentPhone: formData.get('studentPhone'),
                studentGrade: formData.get('studentGrade'),
                
                // Emergency Contact
                emergencyName: formData.get('emergencyName'),
                emergencyRelationship: formData.get('emergencyRelationship'),
                emergencyPhone: formData.get('emergencyPhone'),
                emergencyEmail: formData.get('emergencyEmail'),
                
                // Additional Information
                subjects: formData.getAll('subjects'),
                learningGoals: formData.get('learningGoals'),
                previousExperience: formData.get('previousExperience'),
                
                // Agreements
                privacyAgreement: formData.get('privacyAgreement') === 'on',
                safetyAgreement: formData.get('safetyAgreement') === 'on',
                servicesAgreement: formData.get('servicesAgreement') === 'on',
                communicationConsent: formData.get('communicationConsent') === 'on',
                
                // Metadata
                registrationDate: new Date().toISOString(),
                userAgent: navigator.userAgent
            };

            // Send to API
            try {
                const response = await fetch('/api/registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    this.reset();
                    showNotification('Registration submitted successfully! We will contact you within 24 hours.', 'success');
                    
                    // Scroll to top to show success message
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    showNotification(result.message || 'Failed to submit registration. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to submit registration. Please try again.', 'error');
            }

            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    }
});

// Enhanced form validation for registration
function validateRegistrationForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    const checkboxes = form.querySelectorAll('input[type="checkbox"][required]');
    let isValid = true;

    // Validate required inputs
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#dc3545';
            showFieldError(input, 'This field is required');
        } else {
            input.style.borderColor = '#e9ecef';
            clearFieldError(input);
        }

        // Email validation
        if (input.type === 'email' && input.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.value.trim())) {
                isValid = false;
                input.style.borderColor = '#dc3545';
                showFieldError(input, 'Please enter a valid email address');
            }
        }

        // Phone validation
        if (input.type === 'tel' && input.value.trim()) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = input.value.trim().replace(/[\s\-\(\)]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                isValid = false;
                input.style.borderColor = '#dc3545';
                showFieldError(input, 'Please enter a valid phone number');
            }
        }

        // Name validation (no numbers or special characters)
        if ((input.name.includes('FirstName') || input.name.includes('LastName')) && input.value.trim()) {
            const nameRegex = /^[a-zA-Z\s\-']+$/;
            if (!nameRegex.test(input.value.trim())) {
                isValid = false;
                input.style.borderColor = '#dc3545';
                showFieldError(input, 'Name should only contain letters, spaces, hyphens, and apostrophes');
            }
        }
    });

    // Validate required checkboxes
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            isValid = false;
            const label = checkbox.closest('.checkbox-label');
            if (label) {
                label.style.color = '#dc3545';
                label.style.fontWeight = 'bold';
            }
        } else {
            const label = checkbox.closest('.checkbox-label');
            if (label) {
                label.style.color = '';
                label.style.fontWeight = '';
            }
        }
    });

    // Validate that at least one subject is selected
    const subjectCheckboxes = form.querySelectorAll('input[name="subjects"]');
    const atLeastOneSubject = Array.from(subjectCheckboxes).some(cb => cb.checked);
    
    if (!atLeastOneSubject) {
        isValid = false;
        showNotification('Please select at least one subject of interest.', 'error');
    }

    return isValid;
}

// Show field-specific error messages
function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc3545';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
}

// Clear field-specific error messages
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Real-time validation for better UX
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Add real-time validation for email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.value.trim())) {
                    this.style.borderColor = '#dc3545';
                    showFieldError(this, 'Please enter a valid email address');
                } else {
                    this.style.borderColor = '#28a745';
                    clearFieldError(this);
                }
            }
        });
    });

    // Add real-time validation for phone fields
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim()) {
                const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                const cleanPhone = this.value.trim().replace(/[\s\-\(\)]/g, '');
                if (!phoneRegex.test(cleanPhone)) {
                    this.style.borderColor = '#dc3545';
                    showFieldError(this, 'Please enter a valid phone number');
                } else {
                    this.style.borderColor = '#28a745';
                    clearFieldError(this);
                }
            }
        });
    });

    // Add real-time validation for name fields
    const nameFields = form.querySelectorAll('input[name*="Name"]');
    nameFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim()) {
                const nameRegex = /^[a-zA-Z\s\-']+$/;
                if (!nameRegex.test(this.value.trim())) {
                    this.style.borderColor = '#dc3545';
                    showFieldError(this, 'Name should only contain letters, spaces, hyphens, and apostrophes');
                } else {
                    this.style.borderColor = '#28a745';
                    clearFieldError(this);
                }
            }
        });
    });

    // Clear validation styles on focus
    const allInputs = form.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.borderColor = '#e9ecef';
            clearFieldError(this);
        });
    });
});

// Form progress indicator (optional enhancement)
function updateFormProgress() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const sections = form.querySelectorAll('.form-section');
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    const requiredCheckboxes = form.querySelectorAll('input[type="checkbox"][required]');
    
    let completedFields = 0;
    let totalFields = requiredFields.length + requiredCheckboxes.length;

    requiredFields.forEach(field => {
        if (field.value.trim()) completedFields++;
    });

    requiredCheckboxes.forEach(checkbox => {
        if (checkbox.checked) completedFields++;
    });

    const progress = (completedFields / totalFields) * 100;
    
    // You could add a progress bar here if desired
    console.log(`Form completion: ${Math.round(progress)}%`);
}

// Add progress tracking to form fields
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const allFields = form.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.addEventListener('input', updateFormProgress);
        field.addEventListener('change', updateFormProgress);
    });
});

// Auto-save form data to localStorage (optional feature)
function saveFormData() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (like checkboxes)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    localStorage.setItem('registrationFormData', JSON.stringify(data));
}

function loadFormData() {
    const savedData = localStorage.getItem('registrationFormData');
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);
        const form = document.getElementById('registrationForm');
        if (!form) return;

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = data[key] === 'on' || (Array.isArray(data[key]) && data[key].includes('on'));
                } else {
                    field.value = Array.isArray(data[key]) ? data[key][0] : data[key];
                }
            }
        });
    } catch (error) {
        console.error('Error loading saved form data:', error);
    }
}

// Auto-save every 30 seconds
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Load saved data
    loadFormData();

    // Auto-save
    setInterval(saveFormData, 30000);

    // Save on form submission
    form.addEventListener('submit', function() {
        localStorage.removeItem('registrationFormData');
    });
});

console.log('Registration form JavaScript loaded successfully!');
