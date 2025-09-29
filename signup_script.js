// DOM Elements
const signupForm = document.getElementById('signupForm');
const passwordToggle = document.getElementById('passwordToggle');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const messageContainer = document.getElementById('messageContainer');
const signupBtn = document.querySelector('.login-btn');

// Password visibility toggles
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

confirmPasswordToggle.addEventListener('click', function() {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Form submission handler
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        role: document.getElementById('role').value
    };
    
    // Clear any existing popups
    clearAllPopups();
    
    // Validation
    const validation = validateForm(formData);
    if (!validation.isValid) {
        // Show error popup on the first invalid field
        if (!formData.fullName) {
            showFieldError('fullName', 'Full name is required');
        } else if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showFieldError('email', 'Please enter a valid email');
        } else if (!formData.username || !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
            showFieldError('username', 'Invalid username format');
        } else if (!formData.password || !validatePassword(formData.password).isValid) {
            showFieldError('password', 'Password must be stronger');
        } else if (formData.password !== formData.confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
        } else if (!formData.role) {
            showFieldError('role', 'Please select account type');
        }
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Simulate API call (replace with actual backend integration)
        const response = await registerUser(formData);
        
        if (response.success) {
            showSuccessPopup();
            // Clear form after successful registration
            setTimeout(() => {
                signupForm.reset();
                clearAllPopups();
            }, 4000);
        } else {
            // Show error notification
            if (response.message.includes('email')) {
                showNotification('error', 'Registration Failed', 'Email already registered');
            } else if (response.message.includes('username')) {
                showNotification('error', 'Registration Failed', 'Username already taken');
            } else {
                showNotification('error', 'Registration Failed', response.message || 'Please try again');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('error', 'Registration Failed', 'Please try again');
    } finally {
        setLoadingState(false);
    }
});

// Strong password validation
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        noSpaces: !/\s/.test(password)
    };
    
    const score = Object.values(requirements).filter(Boolean).length;
    const strength = score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak';
    
    return {
        requirements,
        score,
        strength,
        isValid: score >= 4 // Require at least 4 out of 6 criteria
    };
}

// Form validation
function validateForm(data) {
    // Check if all fields are filled
    if (!data.fullName || !data.email || !data.username || !data.password || !data.confirmPassword || !data.role) {
        return { isValid: false, message: 'Please fill in all fields' };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    // Username validation (alphanumeric, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(data.username)) {
        return { isValid: false, message: 'Invalid characters in username' };
    }
    
    // Strong password validation
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
        return { 
            isValid: false, 
            message: 'Password must be stronger' 
        };
    }
    
    // Password confirmation
    if (data.password !== data.confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true };
}

// Registration function (to be replaced with actual backend integration)
async function registerUser(userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock registration logic
    // In real implementation, this would make an API call to your backend
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if username already exists
    if (existingUsers.find(user => user.username === userData.username)) {
        return { success: false, message: 'Username already exists' };
    }
    
    // Check if email already exists
    if (existingUsers.find(user => user.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        fullName: userData.fullName,
        email: userData.email,
        username: userData.username,
        password: userData.password, // In real app, this should be hashed
        role: userData.role,
        createdAt: new Date().toISOString(),
        isActive: true
    };
    
    // Store user in localStorage (in real app, this would be stored in database)
    existingUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    
    return { success: true, user: newUser };
}

// Show field error popup
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove existing popup
    const existingPopup = formGroup.querySelector('.field-error-popup, .field-success-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create error popup
    const popup = document.createElement('div');
    popup.className = 'field-error-popup';
    popup.textContent = message;
    formGroup.appendChild(popup);
    
    // Highlight field
    field.style.borderColor = '#F44336';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
        field.style.borderColor = '#404040';
    }, 4000);
}

// Show field success popup
function showFieldSuccess(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove existing popup
    const existingPopup = formGroup.querySelector('.field-error-popup, .field-success-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create success popup
    const popup = document.createElement('div');
    popup.className = 'field-success-popup';
    popup.textContent = message;
    formGroup.appendChild(popup);
    
    // Highlight field
    field.style.borderColor = '#4CAF50';
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
        }
        field.style.borderColor = '#404040';
    }, 2000);
}

// Clear all field popups
function clearAllPopups() {
    const popups = document.querySelectorAll('.field-error-popup, .field-success-popup');
    popups.forEach(popup => popup.remove());
    
    // Reset all field borders
    const fields = document.querySelectorAll('.form-control');
    fields.forEach(field => {
        field.style.borderColor = '#404040';
    });
}

// Universal notification function
function showNotification(type, title, message, duration = 4000) {
    // Remove any existing notification
    const existingPopup = document.querySelector('.notification-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create notification popup
    const popup = document.createElement('div');
    popup.className = `notification-popup ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    popup.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(popup);
    
    // Auto-hide after specified duration
    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 500);
        }
    }, duration);
}

// Show success popup
function showSuccessPopup() {
    showNotification('success', 'Account Created!', 'Welcome to The Catalog!');
}

// Loading state management
function setLoadingState(loading) {
    if (loading) {
        signupBtn.classList.add('loading');
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner"></i> Creating Account...';
    } else {
        signupBtn.classList.remove('loading');
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

// Real-time password strength indicator
passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strengthContainer = document.getElementById('passwordStrength');
    
    if (password.length > 0) {
        const validation = validatePassword(password);
        showPasswordStrength(validation, strengthContainer);
    } else {
        strengthContainer.innerHTML = '';
    }
});

// Show password strength indicator
function showPasswordStrength(validation, container) {
    const { strength } = validation;
    
    const strengthBars = Array.from({length: 5}, (_, i) => 
        `<div class="strength-bar ${i < validation.score ? strength : ''}"></div>`
    ).join('');
    
    container.innerHTML = `
        <div class="strength-indicator">${strengthBars}</div>
        <div class="strength-text ${strength}">Password strength: ${strength.toUpperCase()}</div>
    `;
}

// Real-time password confirmation validation
confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
    } else if (confirmPassword && password === confirmPassword) {
        showFieldSuccess('confirmPassword', 'Passwords match');
    }
});

// Username availability check (simulated)
document.getElementById('username').addEventListener('blur', function() {
    const username = this.value.trim();
    if (username) {
        const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        if (existingUsers.find(user => user.username === username)) {
            showFieldError('username', 'Username taken');
        } else {
            showFieldSuccess('username', 'Available');
        }
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth animations
    const card = document.querySelector('.login-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);
});
