// Multi-Stage Registration Wizard
class RegistrationWizard {
    constructor() {
        this.currentStage = 1;
        this.totalStages = 5;
        this.formData = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateProgress();
        this.updateNavigation();
    }

    bindEvents() {
        const form = document.getElementById('registrationWizard');

        // Bind events to all navigation buttons (they exist in each stage)
        form.addEventListener('click', (e) => {
            if (e.target.id === 'nextBtn' || e.target.closest('#nextBtn')) {
                e.preventDefault();
                this.nextStage();
            } else if (e.target.id === 'prevBtn' || e.target.closest('#prevBtn')) {
                e.preventDefault();
                this.prevStage();
            } else if (e.target.id === 'submitBtn' || e.target.closest('#submitBtn')) {
                e.preventDefault();
                this.submitForm(e);
            }
        });

        form.addEventListener('submit', (e) => this.submitForm(e));

        // Handle liability release checkbox to enable/disable submit button
        this.setupLiabilityReleaseHandler();

        // Handle emergency contact "same as parent" checkbox
        const sameAsParentCheckbox = document.getElementById('sameAsParent');
        const emergencyContactFields = document.getElementById('emergencyContactFields');
        
        if (sameAsParentCheckbox && emergencyContactFields) {
            // Initialize the state based on current checkbox value
            this.updateEmergencyContactFields(sameAsParentCheckbox.checked);
            
            sameAsParentCheckbox.addEventListener('change', (e) => {
                this.updateEmergencyContactFields(e.target.checked);
            });
            
            // Also listen for changes to parent fields to auto-update emergency contact if "same as parent" is checked
            const parentFields = ['parentFullName', 'parentPhone', 'parentEmail', 'parentAddress'];
            parentFields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.addEventListener('input', () => {
                        if (sameAsParentCheckbox.checked) {
                            this.updateEmergencyContactFields(true);
                        }
                    });
                }
            });
        }
    }

    updateEmergencyContactFields(sameAsParent) {
        const emergencyContactFields = document.getElementById('emergencyContactFields');
        const sameAsParentCheckbox = document.getElementById('sameAsParent');
        
        // Ensure the checkbox always has a value
        if (sameAsParentCheckbox) {
            sameAsParentCheckbox.value = sameAsParent ? '1' : '0';
        }
        
        if (sameAsParent) {
            // Pre-fill emergency contact fields with parent information
            const parentFullName = document.getElementById('parentFullName')?.value || '';
            const parentPhone = document.getElementById('parentPhone')?.value || '';
            const parentEmail = document.getElementById('parentEmail')?.value || '';
            const parentAddress = document.getElementById('parentAddress')?.value || '';
            
            // Pre-fill emergency contact fields
            const emergencyName = document.getElementById('emergencyName');
            const emergencyPhone = document.getElementById('emergencyPhone');
            const emergencyEmail = document.getElementById('emergencyEmail');
            const emergencyAddress = document.getElementById('emergencyAddress');
            const emergencyRelationship = document.getElementById('emergencyRelationship');
            
            if (emergencyName) {
                emergencyName.value = parentFullName;
                emergencyName.readOnly = true;
            }
            if (emergencyPhone) {
                emergencyPhone.value = parentPhone;
                emergencyPhone.readOnly = true;
            }
            if (emergencyEmail) {
                emergencyEmail.value = parentEmail;
            }
            if (emergencyAddress) {
                emergencyAddress.value = parentAddress;
            }
            if (emergencyRelationship) {
                emergencyRelationship.value = 'Parent';
                emergencyRelationship.disabled = true;
            }
            
            // Keep fields visible but readonly
            emergencyContactFields.style.display = 'block';
        } else {
            // Clear and enable fields
            const emergencyName = document.getElementById('emergencyName');
            const emergencyPhone = document.getElementById('emergencyPhone');
            const emergencyEmail = document.getElementById('emergencyEmail');
            const emergencyAddress = document.getElementById('emergencyAddress');
            const emergencyRelationship = document.getElementById('emergencyRelationship');
            
            if (emergencyName) {
                emergencyName.value = '';
                emergencyName.readOnly = false;
            }
            if (emergencyPhone) {
                emergencyPhone.value = '';
                emergencyPhone.readOnly = false;
            }
            if (emergencyEmail) {
                emergencyEmail.value = '';
            }
            if (emergencyAddress) {
                emergencyAddress.value = '';
            }
            if (emergencyRelationship) {
                emergencyRelationship.value = '';
                emergencyRelationship.disabled = false;
            }
            
            emergencyContactFields.style.display = 'block';
        }
    }

    nextStage() {
        if (this.validateCurrentStage()) {
            this.saveCurrentStageData();
            this.currentStage++;
            this.showStage(this.currentStage);
            this.updateProgress();
            this.updateNavigation();
            this.loadStageData();
        }
    }

    prevStage() {
        this.saveCurrentStageData();
        this.currentStage--;
        this.showStage(this.currentStage);
        this.updateProgress();
        this.updateNavigation();
        this.loadStageData();
    }

    showStage(stageNumber) {
        // Hide all stages
        document.querySelectorAll('.wizard-stage').forEach(stage => {
            stage.classList.remove('active');
        });

        // Show current stage
        const currentStageElement = document.querySelector(`[data-stage="${stageNumber}"]`);
        if (currentStageElement) {
            currentStageElement.classList.add('active');
        }

        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    validateCurrentStage() {
        const currentStageElement = document.querySelector(`[data-stage="${this.currentStage}"]`);
        const requiredFields = currentStageElement.querySelectorAll('[required]');
        let isValid = true;

        console.log(`Validating stage ${this.currentStage}, found ${requiredFields.length} required fields`);

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                console.log(`Field ${field.name} failed validation`);
            }
        });

        // Special validation for stage 4 (emergency contact)
        if (this.currentStage === 4) {
            const sameAsParentCheckbox = document.getElementById('sameAsParent');
            if (sameAsParentCheckbox && sameAsParentCheckbox.checked) {
                // If same as parent, ensure parent fields are filled
                const parentFullName = document.getElementById('parentFullName');
                const parentPhone = document.getElementById('parentPhone');
                
                if (!parentFullName || !parentFullName.value.trim()) {
                    isValid = false;
                    console.log('Parent name is required for emergency contact');
                }
                if (!parentPhone || !parentPhone.value.trim()) {
                    isValid = false;
                    console.log('Parent phone is required for emergency contact');
                }
            }
        }

        if (!isValid) {
            console.log('Stage validation failed');
        } else {
            console.log('Stage validation passed');
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        // Clear previous error styling
        field.style.borderColor = '#e9ecef';
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            field.style.borderColor = '#dc3545';
            this.showFieldError(field, 'This field is required');
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                field.style.borderColor = '#dc3545';
                this.showFieldError(field, 'Please enter a valid email address');
            }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                isValid = false;
                field.style.borderColor = '#dc3545';
                this.showFieldError(field, 'Please enter a valid phone number');
            }
        }

        // Name validation
        if ((field.name.includes('FirstName') || field.name.includes('LastName')) && value) {
            const nameRegex = /^[a-zA-Z\s\-']+$/;
            if (!nameRegex.test(value)) {
                isValid = false;
                field.style.borderColor = '#dc3545';
                this.showFieldError(field, 'Name should only contain letters, spaces, hyphens, and apostrophes');
            }
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    saveCurrentStageData() {
        const currentStageElement = document.querySelector(`[data-stage="${this.currentStage}"]`);
        const formData = new FormData();
        
        // Get all form elements in current stage
        const inputs = currentStageElement.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                // Always save checkbox value (checked = 1, unchecked = 0)
                formData.append(input.name, input.checked ? '1' : '0');
            } else {
                formData.append(input.name, input.value);
            }
        });

        // Convert FormData to object
        const stageData = {};
        for (let [key, value] of formData.entries()) {
            if (stageData[key]) {
                // Handle multiple values (like checkboxes)
                if (Array.isArray(stageData[key])) {
                    stageData[key].push(value);
                } else {
                    stageData[key] = [stageData[key], value];
                }
            } else {
                stageData[key] = value;
            }
        }

        this.formData[`stage${this.currentStage}`] = stageData;
    }

    loadStageData() {
        const stageData = this.formData[`stage${this.currentStage}`];
        if (!stageData) {
            // If no saved data and on stage 5, ensure submit button is disabled
            if (this.currentStage === 5) {
                this.updateSubmitButtonState();
            }
            return;
        }

        const currentStageElement = document.querySelector(`[data-stage="${this.currentStage}"]`);
        
        Object.keys(stageData).forEach(fieldName => {
            const field = currentStageElement.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    // Handle checkbox values (1 = checked, 0 = unchecked)
                    field.checked = stageData[fieldName] === '1' || stageData[fieldName] === 'true' || stageData[fieldName] === true;
                    // Update the field value to match the checked state
                    field.value = field.checked ? '1' : '0';
                } else {
                    field.value = Array.isArray(stageData[fieldName]) ? stageData[fieldName][0] : stageData[fieldName];
                }
            }
        });
        
        // Special handling for emergency contact fields
        if (this.currentStage === 4) {
            const sameAsParentCheckbox = document.getElementById('sameAsParent');
            if (sameAsParentCheckbox) {
                // Delay slightly to ensure parent data is loaded first
                setTimeout(() => {
                    this.updateEmergencyContactFields(sameAsParentCheckbox.checked);
                }, 50);
            }
        }
        
        // Update submit button state when loading stage 5
        if (this.currentStage === 5) {
            this.updateSubmitButtonState();
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = (this.currentStage / this.totalStages) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < this.currentStage) {
                step.classList.add('completed');
            } else if (index + 1 === this.currentStage) {
                step.classList.add('active');
            }
        });
    }

    updateNavigation() {
        // Hide all navigation buttons first
        document.querySelectorAll('#prevBtn, #nextBtn, #submitBtn').forEach(btn => {
            btn.style.display = 'none';
        });

        // Get buttons from the current active stage
        const currentStageElement = document.querySelector(`[data-stage="${this.currentStage}"]`);
        if (!currentStageElement) return;

        const prevBtn = currentStageElement.querySelector('#prevBtn');
        const nextBtn = currentStageElement.querySelector('#nextBtn');
        const submitBtn = currentStageElement.querySelector('#submitBtn');

        // Show/hide Previous button
        if (this.currentStage > 1 && prevBtn) {
            prevBtn.style.display = 'inline-flex';
        }

        // Show/hide Next/Submit buttons
        if (this.currentStage === this.totalStages && submitBtn) {
            submitBtn.style.display = 'inline-flex';
            // Update submit button state based on liability release checkbox
            this.updateSubmitButtonState();
        } else if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
        }
    }

    setupLiabilityReleaseHandler() {
        // Use event delegation since checkbox may not exist when page loads
        const form = document.getElementById('registrationWizard');
        
        form.addEventListener('change', (e) => {
            if (e.target.id === 'liabilityRelease') {
                this.updateSubmitButtonState();
            }
        });
    }

    updateSubmitButtonState() {
        const liabilityReleaseCheckbox = document.getElementById('liabilityRelease');
        const submitBtn = document.getElementById('submitBtn');
        
        if (liabilityReleaseCheckbox && submitBtn) {
            const isChecked = liabilityReleaseCheckbox.checked;
            submitBtn.disabled = !isChecked;
            
            // Update button styling based on state
            if (isChecked) {
                submitBtn.classList.remove('btn-secondary');
                submitBtn.classList.add('btn-primary');
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            } else {
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-secondary');
                submitBtn.style.opacity = '0.6';
                submitBtn.style.cursor = 'not-allowed';
            }
        }
    }

    saveFormData() {
        // Auto-save to localStorage
        localStorage.setItem('registrationWizardData', JSON.stringify(this.formData));
    }

    loadFormData() {
        // Load from localStorage
        const savedData = localStorage.getItem('registrationWizardData');
        if (savedData) {
            try {
                this.formData = JSON.parse(savedData);
                this.loadStageData();
            } catch (error) {
                console.error('Error loading saved form data:', error);
            }
        }
    }

    async submitForm(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStage()) {
            // Don't show notification, fields are already marked with red borders
            return;
        }

        // Save final stage data
        this.saveCurrentStageData();

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<span class="loading"></span> Completing Registration...';
        submitBtn.disabled = true;

        try {
            // Prepare final data
            const finalData = this.prepareFinalData();
            
            // Send to API
            const response = await fetch('/api/registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData)
            });

            const result = await response.json();

            if (response.ok) {
                // Clear saved data
                localStorage.removeItem('registrationWizardData');
                
                // Show success page
                this.showSuccessPage();
                
            } else {
                showNotification(result.message || 'Failed to complete registration. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to complete registration. Please try again.', 'error');
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }

    showSuccessPage() {
        // Show the success page as overlay
        const successPage = document.getElementById('successPage');
        if (successPage) {
            successPage.style.display = 'flex';
            // Scroll to top to show success card
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    prepareFinalData() {
        // Combine all stage data
        const combinedData = {};
        
        Object.keys(this.formData).forEach(stageKey => {
            Object.assign(combinedData, this.formData[stageKey]);
        });

        // Add metadata
        combinedData.registrationDate = new Date().toISOString();
        combinedData.userAgent = navigator.userAgent;
        combinedData.wizardVersion = '1.0';

        return combinedData;
    }
}

// Initialize wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const wizard = new RegistrationWizard();
    
    // Load any saved data
    wizard.loadFormData();
    
    // Add real-time validation
    const form = document.getElementById('registrationWizard');
    if (form) {
        form.addEventListener('blur', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                wizard.validateField(e.target);
            }
        }, true);
    }
});

// Notification system (reuse from existing script)
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

console.log('Registration wizard loaded successfully!');

// Function to close registration and return to home page
function closeRegistration() {
    // Hide the success page overlay
    const successPage = document.getElementById('successPage');
    if (successPage) {
        successPage.style.display = 'none';
    }
    // Redirect to home page
    window.location.href = 'index.html';
}
