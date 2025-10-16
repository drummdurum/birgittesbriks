// Booking form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitLoading = document.getElementById('submit-loading');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    // Set minimum date to today
    const dateInput = document.getElementById('ønsket_dato');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;

    // Form validation functions
    const validateField = (field) => {
        // Try to find error div in parent element, or in parent's parent for checkbox
        let errorDiv = field.parentElement.querySelector('.error-message');
        if (!errorDiv && field.type === 'checkbox') {
            errorDiv = field.parentElement.parentElement.querySelector('.error-message');
        }
        
        let isValid = true;
        let errorMsg = '';

        // Skip validation if no error div found
        if (!errorDiv) {
            console.warn('No error div found for field:', field.name);
            return true;
        }

        switch(field.name) {
            case 'navn':
                if (!field.value.trim()) {
                    errorMsg = 'Navn er påkrævet';
                    isValid = false;
                } else if (field.value.trim().length < 2) {
                    errorMsg = 'Navn skal være mindst 2 tegn';
                    isValid = false;
                } else if (!/^[a-zA-ZæøåÆØÅ\s-]+$/.test(field.value.trim())) {
                    errorMsg = 'Navn må kun indeholde bogstaver, mellemrum og bindestreger';
                    isValid = false;
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!field.value.trim()) {
                    errorMsg = 'Email er påkrævet';
                    isValid = false;
                } else if (!emailRegex.test(field.value.trim())) {
                    errorMsg = 'Indtast en gyldig email adresse';
                    isValid = false;
                }
                break;

            case 'telefon':
                const phoneRegex = /^[\d\s+()-]+$/;
                if (!field.value.trim()) {
                    errorMsg = 'Telefonnummer er påkrævet';
                    isValid = false;
                } else if (!phoneRegex.test(field.value.trim()) || field.value.trim().length < 8) {
                    errorMsg = 'Indtast et gyldigt telefonnummer';
                    isValid = false;
                }
                break;

            case 'ønsket_dato':
                if (field.value && new Date(field.value) < new Date(today)) {
                    errorMsg = 'Datoen kan ikke være i fortiden';
                    isValid = false;
                }
                break;

            case 'besked':
                if (field.value.trim().length > 1000) {
                    errorMsg = 'Besked må maks være 1000 tegn';
                    isValid = false;
                }
                break;

            case 'gdpr_samtykke':
                if (!field.checked) {
                    errorMsg = 'Du skal acceptere behandling af persondata';
                    isValid = false;
                }
                break;
        }

        // Show/hide error message
        if (errorDiv) {
            if (isValid) {
                errorDiv.classList.add('hidden');
                field.classList.remove('border-red-500');
                field.classList.add('border-gray-300');
            } else {
                errorDiv.textContent = errorMsg;
                errorDiv.classList.remove('hidden');
                field.classList.add('border-red-500');
                field.classList.remove('border-gray-300');
            }
        }

        return isValid;
    };

    // Add real-time validation to required fields
    ['navn', 'email', 'telefon', 'ønsket_dato', 'besked'].forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('border-red-500')) {
                    validateField(field);
                }
            });
        }
    });

    // GDPR checkbox validation
    const gdprCheckbox = document.getElementById('gdpr_samtykke');
    gdprCheckbox.addEventListener('change', () => validateField(gdprCheckbox));

    // Show/hide messages
    const showMessage = (element) => {
        element.classList.remove('hidden');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Auto-hide after 8 seconds
        setTimeout(() => {
            element.classList.add('hidden');
        }, 8000);
    };

    const hideMessages = () => {
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
    };

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        // Validate all fields
        const fields = form.querySelectorAll('input, textarea, select');
        let isFormValid = true;

        fields.forEach(field => {
            if (field.name && !validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            errorText.textContent = 'Ret venligst fejlene i formularen før indsendelse.';
            showMessage(errorMessage);
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitText.classList.add('hidden');
        submitLoading.classList.remove('hidden');

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert checkbox to boolean
            data.gdpr_samtykke = gdprCheckbox.checked ? 'true' : 'false';

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Success
                form.reset();
                showMessage(successMessage);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Error
                if (result.details && Array.isArray(result.details)) {
                    // Validation errors from server
                    result.details.forEach(error => {
                        const field = document.getElementById(error.param);
                        if (field) {
                            const errorDiv = field.parentElement.querySelector('.error-message');
                            errorDiv.textContent = error.msg;
                            errorDiv.classList.remove('hidden');
                            field.classList.add('border-red-500');
                        }
                    });
                    errorText.textContent = 'Ret venligst fejlene markeret nedenfor.';
                } else {
                    errorText.textContent = result.error || 'Der opstod en fejl. Prøv igen eller ring på 21 85 34 17.';
                }
                showMessage(errorMessage);
            }
        } catch (error) {
            console.error('Booking error:', error);
            errorText.textContent = 'Der opstod en netværksfejl. Tjek din internetforbindelse og prøv igen.';
            showMessage(errorMessage);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitText.classList.remove('hidden');
            submitLoading.classList.add('hidden');
        }
    });

    // Phone number formatting
    const phoneInput = document.getElementById('telefon');
    phoneInput.addEventListener('input', function(e) {
        // Remove all non-digits
        let value = e.target.value.replace(/\D/g, '');
        
        // Format Danish phone number
        if (value.length >= 8) {
            value = value.replace(/(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
        } else if (value.length >= 6) {
            value = value.replace(/(\d{2})(\d{2})(\d{2})/, '$1 $2 $3');
        } else if (value.length >= 4) {
            value = value.replace(/(\d{2})(\d{2})/, '$1 $2');
        }
        
        e.target.value = value;
    });
});