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
                window.location.replace('dashboard.html');
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

// SIGNUP HANDLER (real backend)
async function handleSignup(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();
    const confirmPassword = document.getElementById('confirmPassword')?.value.trim();
    const role = document.getElementById('role')?.value;

    if (!username || !email || !password) {
        showNotification('error', 'Validation Error', 'Please fill all required fields');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('error', 'Password Mismatch', 'Passwords do not match');
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
