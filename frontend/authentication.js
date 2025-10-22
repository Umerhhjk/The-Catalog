// frontend + backend bridge

const API_URL = "http://localhost:5000/api";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const messageContainer = document.getElementById('messageContainer');
const loginBtn = document.querySelector('.login-btn');
const passwordToggles = document.querySelectorAll('.password-toggle');

// Password visibility toggles
passwordToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
});


//LOGIN HANDLER (real backend)

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showNotification('error', 'Validation Error', 'Please fill in all fields');
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('success', 'Login Successful', 'Redirecting to dashboard...');
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            setTimeout(() => {
                window.location.replace('dashboard/dashboard.html');
            }, 1500);
        } else {
            showNotification('error', 'Login Failed', data.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('error', 'Login Failed', 'Server unreachable. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// SIGNUP HANDLER (real backend with validation rules)
async function handleSignup(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();
    const role = document.getElementById('role')?.value;

    // Validation rules (only on form submission)
    const validation = validateSignupForm({
        fullName, email, username, password, confirmPassword, role
    });
    
    if (!validation.isValid) {
        showNotification('error', 'Validation Error', validation.message);
        return;
    }

    setLoadingState(true);

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showNotification('success', 'Signup Successful', 'Redirecting to login...');
            signupForm.reset();
            setTimeout(() => {
                window.location.replace('index.html');
            }, 2000);
        } else {
            showNotification('error', 'Signup Failed', data.message || 'Unable to register');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('error', 'Signup Failed', 'Server unreachable. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// VALIDATION FUNCTIONS (only used on form submission)
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
    return score >= 4; // Require at least 4 out of 6 criteria
}

function validateSignupForm(data) {
    // Check required fields
    if (!data.fullName) {
        return { isValid: false, message: 'Full name is required' };
    }
    
    if (!data.email) {
        return { isValid: false, message: 'Email is required' };
    }
    
    if (!data.username) {
        return { isValid: false, message: 'Username is required' };
    }
    
    if (!data.password) {
        return { isValid: false, message: 'Password is required' };
    }
    
    if (!data.confirmPassword) {
        return { isValid: false, message: 'Please confirm your password' };
    }
    
    if (!data.role) {
        return { isValid: false, message: 'Please select account type' };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    // Username validation (alphanumeric, 3-20 characters, no email patterns)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const emailPattern = /@.*\.(com|org|net|edu|gov|co|uk|ca|au|de|fr|it|es|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|sk|si|lt|lv|ee|lu|mt|cy|ie|pt|gr|be|at|ch|li|is|ad|mc|sm|va)$/i;
    
    if (!usernameRegex.test(data.username)) {
        return { isValid: false, message: 'Username must be 3-20 characters, letters, numbers, and underscores only' };
    }
    
    if (emailPattern.test(data.username)) {
        return { isValid: false, message: 'Username cannot contain email patterns.' };
    }
    
    // Full name validation (no email patterns)
    if (emailPattern.test(data.fullName)) {
        return { isValid: false, message: 'Full name cannot contain email patterns' };
    }
    
    if (!/^[a-zA-Z\s\-'\.]+$/.test(data.fullName)) {
        return { isValid: false, message: 'Full name can only contain letters, spaces, hyphens, apostrophes, and periods' };
    }
    
    // Password validation
    if (!validatePassword(data.password)) {
        return { isValid: false, message: 'Password must be stronger.' };
    }
    
    // Password confirmation
    if (data.password !== data.confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true };
}

// Change password validation
function validateChangePasswordForm(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
        return { isValid: false, message: 'All fields are required' };
    }

    if (newPassword !== confirmPassword) {
        return { isValid: false, message: 'New passwords do not match' };
    }

    if (!validatePassword(newPassword)) {
        return { isValid: false, message: 'New password must be stronger (at least 8 characters, mix of letters, numbers, and symbols)' };
    }

    return { isValid: true };
}

// Change password API function
async function changePasswordAPI(username, currentPassword, newPassword) {
    const response = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            currentPassword: currentPassword,
            newPassword: newPassword
        })
    });

    return response;
}

// Custom Notification Popups
function showNotification(type, title, message, duration = 4000) {
    const existingPopup = document.querySelector('.notification-popup');
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement('div');
    popup.className = `notification-popup ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    popup.innerHTML = `
        <div class="notification-icon"><i class="fas ${icon}"></i></div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => popup.remove(), 500);
        }
    }, duration);
}

//Loading Button Animation
function setLoadingState(loading) {
    if (!loginBtn) return;

    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
    }
}

// Health Check for API Connection
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log(`API Healthy (${data.database} DB)`);
    } catch {
        console.warn('API not reachable at', API_URL);
        showNotification('error', 'Server Offline', 'Backend not reachable (check Flask).');
    }
}


// page Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAPIHealth();

    const card = document.querySelector('.login-card');
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }

    // Attach event listeners depending on the page
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});
