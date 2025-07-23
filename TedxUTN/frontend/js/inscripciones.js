// Form validation and submission handling for inscriptions page

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Clear any previous error states
    clearErrors();
    
    // Validate form
    if (!validateForm()) {
        showMessage('Por favor, completa todos los campos requeridos correctamente.', 'error');
        return false;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;
    
    try {
        // Get form data
        const formData = new FormData(document.getElementById('inscriptionForm'));
        const data = {};
        
        // Convert FormData to object
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
        
        // Send data to our API
        const response = await fetch('/api/registrations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar la inscripción');
        }
        
        const result = await response.json();
        
        // Show success message with registration ID
        showSuccessModal({...data, registrationId: result.data.id});
        
        // Reset form
        document.getElementById('inscriptionForm').reset();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        
        // Handle specific error types
        if (error.message.includes('email') && error.message.includes('existe')) {
            showMessage('Este email ya está registrado. Por favor, usa otro email.', 'error');
        } else if (error.message.includes('DNI') && error.message.includes('existe')) {
            showMessage('Este DNI ya está registrado. Por favor, verifica tus datos.', 'error');
        } else if (error.message.includes('límite')) {
            showMessage('Has alcanzado el límite de intentos. Por favor, espera antes de intentar nuevamente.', 'error');
        } else {
            showMessage(error.message || 'Error al enviar la inscripción. Por favor, intenta nuevamente.', 'error');
        }
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
    
    return false;
}

function validateForm() {
    const form = document.getElementById('inscriptionForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    // Validate required fields
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    // Email validation
    const email = form.querySelector('#email');
    if (email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            showFieldError(email, 'Por favor, ingresa un email válido');
            isValid = false;
        }
    }
    
    // Phone validation
    const phone = form.querySelector('#phone');
    if (phone.value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.value.replace(/[\s\-\(\)]/g, ''))) {
            showFieldError(phone, 'Por favor, ingresa un teléfono válido');
            isValid = false;
        }
    }
    
    // DNI validation
    const dni = form.querySelector('#dni');
    if (dni.value) {
        const dniRegex = /^\d{7,8}$/;
        if (!dniRegex.test(dni.value)) {
            showFieldError(dni, 'El DNI debe tener entre 7 y 8 dígitos');
            isValid = false;
        }
    }
    
    // Age validation (must be at least 16 years old)
    const birthDate = form.querySelector('#birthDate');
    if (birthDate.value) {
        const today = new Date();
        const birth = new Date(birthDate.value);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        if (age < 16) {
            showFieldError(birthDate, 'Debes tener al menos 16 años para inscribirte');
            isValid = false;
        }
    }      // UTN relationship validation
    const utnRelation = form.querySelector('input[name="utnRelation"]:checked');
    if (utnRelation && (utnRelation.value === 'estudiante' || utnRelation.value === 'graduado' || utnRelation.value === 'docente')) {
        
        if (utnRelation.value === 'docente') {
            // Validate subject field for teachers
            const subject = form.querySelector('#subject');
            if (!subject.value.trim()) {
                showFieldError(subject, 'Por favor, ingresa la materia que enseñas');
                isValid = false;
            }
        } else {
            // Validate career field for students and graduates
            const utnCareer = form.querySelector('#utnCareer');
            if (!utnCareer.value) {
                showFieldError(utnCareer, 'Por favor, selecciona tu carrera');
                isValid = false;
            }
        }
        
        // Additional validation for students
        if (utnRelation.value === 'estudiante') {
            // Validate legajo field
            const legajo = form.querySelector('#legajo');
            if (!legajo.value.trim()) {
                showFieldError(legajo, 'Por favor, ingresa tu legajo');
                isValid = false;
            }
  
            
            // Validate current year field
            const currentYearSelected = form.querySelector('input[name="currentYear"]:checked');
            if (!currentYearSelected) {
                const currentYearContainer = form.querySelector('#currentYearField');
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = 'Por favor, selecciona el año que estás cursando';
                errorMessage.style.cssText = 'color: #dc3545; font-size: 0.9rem; margin-top: 5px;';
                
                // Remove existing error message
                const existingError = currentYearContainer.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                currentYearContainer.appendChild(errorMessage);
                isValid = false;
            }        }
    }    // Validate required radio button groups for "Conociéndote" section
    const requiredRadioGroups = [
        { name: 'knewTED', message: 'Por favor, indica si conocías previamente las charlas TED' },
        { name: 'previousParticipation', message: 'Por favor, indica si participaste en alguna edición anterior' },
        { name: 'howFoundOut', message: 'Por favor, indica cómo te enteraste de esta edición' }
    ];

    requiredRadioGroups.forEach(group => {
        const selected = form.querySelector(`input[name="${group.name}"]:checked`);
        if (!selected) {
            // Find the radio group container
            const radioContainer = form.querySelector(`input[name="${group.name}"]`).closest('.form-group');
            if (radioContainer) {
                // Remove existing error message
                const existingError = radioContainer.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = group.message;
                errorMessage.style.cssText = 'color: #dc3545; font-size: 0.9rem; margin-top: 5px;';
                radioContainer.appendChild(errorMessage);
                isValid = false;
            }
        }
    });

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc3545; font-size: 0.9rem; margin-top: 5px;';
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

function clearErrors() {
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => {
        clearFieldError(field);
    });
    
    // Clear errors from new fields
    const specialityContainer = document.querySelector('#specialityField');
    const currentYearContainer = document.querySelector('#currentYearField');
    
    if (specialityContainer) {
        const existingError = specialityContainer.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    if (currentYearContainer) {
        const existingError = currentYearContainer.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
}

function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
    
    const colors = {
        error: '#dc3545',
        success: '#28a745',
        info: '#17a2b8'
    };
    
    messageDiv.style.cssText = `
        background: ${colors[type]}15;
        color: ${colors[type]};
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid ${colors[type]};
        font-weight: 500;
    `;
    
    const form = document.querySelector('.registration-form');
    form.insertBefore(messageDiv, form.firstChild);
    
    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccessModal(data) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;
      modal.innerHTML = `
        <div style="color: #28a745; font-size: 4rem; margin-bottom: 20px;">
            <i class="fas fa-check-circle"></i>
        </div>
        <h2 style="color: #333; margin-bottom: 20px; font-size: 2rem;">¡Inscripción Exitosa!</h2>
        <p style="color: #666; margin-bottom: 20px; line-height: 1.6;">
            Gracias <strong>${data.firstName} ${data.lastName}</strong> por inscribirte a TEDxUTN 2025.
        </p>
        ${data.registrationId ? `
        <div style="background: #e8f5e8; border: 2px solid #28a745; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <h4 style="color: #28a745; margin-bottom: 10px;">Número de Inscripción</h4>
            <p style="font-size: 1.2rem; font-weight: bold; color: #333; margin: 0;">#${data.registrationId}</p>
            <p style="font-size: 0.9rem; color: #666; margin: 5px 0 0 0;">Guarda este número para futuras consultas</p>
        </div>
        ` : ''}
        <p style="color: #666; margin-bottom: 30px; line-height: 1.6;">
            Hemos enviado un email de confirmación a <strong>${data.email}</strong> con toda la información necesaria, incluyendo los detalles de pago.
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
            <h4 style="color: #e62b1e; margin-bottom: 15px;">Próximos pasos:</h4>
            <ul style="text-align: left; color: #666; line-height: 1.8;">
                <li>1. Revisa tu email (incluyendo spam/promociones)</li>
                <li>2. Completa el pago según las instrucciones</li>
                <li>3. Guarda el comprobante de pago</li>
                <li>4. ¡Prepárate para una experiencia increíble!</li>
            </ul>
        </div>
        <button onclick="closeModal()" style="
            background: linear-gradient(135deg, #e62b1e 0%, #ff4444 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        ">
            Cerrar
        </button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Close modal function
    window.closeModal = function() {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
            delete window.closeModal;
        }, 300);
    };
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            window.closeModal();
        }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            window.closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Function to toggle UTN career field visibility
function toggleCareerField(value) {
    console.log('toggleCareerField called with value:', value); // Debug log
    
    const careerField = document.getElementById('careerField');
    const utnCareerSelect = document.getElementById('utnCareer');
    const subjectField = document.getElementById('subjectField');
    const subjectInput = document.getElementById('subject');
    const legajoField = document.getElementById('legajoField');
    const currentYearField = document.getElementById('currentYearField');
    const legajoInput = document.getElementById('legajo');
    
    // Debug logs
    console.log('careerField found:', careerField);
    console.log('subjectField found:', subjectField);
    
    if (value === 'estudiante' || value === 'graduado' || value === 'docente') {
        console.log('Showing UTN-related fields for:', value);
        
        if (value === 'docente') {
            // For teachers: show subject field, hide career field
            console.log('Showing subject field for teacher');
            careerField.style.display = 'none';
            subjectField.style.display = 'block';
            subjectField.style.opacity = '1';
            subjectInput.setAttribute('required', 'required');
            utnCareerSelect.removeAttribute('required');
            utnCareerSelect.value = '';
            
            // Hide student-specific fields
            legajoField.style.display = 'none';
            currentYearField.style.display = 'none';
            legajoInput.removeAttribute('required');
            legajoInput.value = '';
            
            // Clear current year selection
            const currentYearInputs = document.querySelectorAll('input[name="currentYear"]');
            currentYearInputs.forEach(input => input.checked = false);
        } else {
            // For students and graduates: show career field, hide subject field
            console.log('Showing career field for:', value);
            careerField.style.display = 'block';
            careerField.style.opacity = '1';
            subjectField.style.display = 'none';
            utnCareerSelect.setAttribute('required', 'required');
            subjectInput.removeAttribute('required');
            subjectInput.value = '';
            
            // Show additional fields for students
            if (value === 'estudiante') {
                console.log('Showing student-specific fields');
                legajoField.style.display = 'block';
                legajoField.style.opacity = '1';
                currentYearField.style.display = 'block';
                currentYearField.style.opacity = '1';
                legajoInput.setAttribute('required', 'required');
            } else {
                console.log('Hiding student-specific fields');
                legajoField.style.display = 'none';
                currentYearField.style.display = 'none';
                legajoInput.removeAttribute('required');
                legajoInput.value = '';
                
                // Clear current year selection
                const currentYearInputs = document.querySelectorAll('input[name="currentYear"]');
                currentYearInputs.forEach(input => input.checked = false);
            }
        }
    } else {
        console.log('Hiding all UTN-related fields');
        careerField.style.display = 'none';
        subjectField.style.display = 'none';
        legajoField.style.display = 'none';
        currentYearField.style.display = 'none';
        
        utnCareerSelect.removeAttribute('required');
        subjectInput.removeAttribute('required');
        legajoInput.removeAttribute('required');
        
        utnCareerSelect.value = '';
        subjectInput.value = '';
        legajoInput.value = '';
        
        // Clear current year selection
        const currentYearInputs = document.querySelectorAll('input[name="currentYear"]');
        currentYearInputs.forEach(input => input.checked = false);
    }
}

// Auto-format fields
document.addEventListener('DOMContentLoaded', function() {
    // Format DNI input
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', function(e) {
            // Remove non-digits
            this.value = this.value.replace(/\D/g, '');
            // Limit to 8 digits
            if (this.value.length > 8) {
                this.value = this.value.slice(0, 8);
            }
        });
    }
    
    // Format phone input
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            // Remove non-digits and format
            let value = this.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                }
            }
            this.value = value;
        });
    }
    
    // Real-time validation
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required') && !this.value.trim()) {
                showFieldError(this, 'Este campo es requerido');
            } else {
                clearFieldError(this);
            }
        });
    });
});

// Add fadeOut animation to styles
const fadeOutStyle = document.createElement('style');
fadeOutStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(fadeOutStyle);
