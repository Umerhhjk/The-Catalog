// DOM Elements
const loginForm = document.getElementById('loginForm');
const passwordToggle = document.getElementById('passwordToggle');
const passwordInput = document.getElementById('password');
const messageContainer = document.getElementById('messageContainer');
const loginBtn = document.querySelector('.login-btn');

// Password visibility toggle
passwordToggle.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Form submission handler
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!username || !password) {
        showNotification('error', 'Validation Error', 'Please fill in all fields');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Simulate API call (replace with actual backend integration)
        const response = await authenticateUser(username, password);
        
        if (response.success) {
            showNotification('success', 'Login Successful', 'Redirecting to dashboard...');
            // Redirect to dashboard after successful login
            setTimeout(() => {
                window.location.replace('dashboard.html');
            }, 1500);
        } else {
            showNotification('error', 'Login Failed', response.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('error', 'Login Failed', 'Please try again');
    } finally {
        setLoadingState(false);
    }
});

// Authentication function (to be replaced with actual backend integration)
async function authenticateUser(username, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication logic
    // In real implementation, this would make an API call to your backend
    const mockUsers = [
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'librarian', password: 'lib123', role: 'librarian' },
        { username: 'student', password: 'student123', role: 'student' }
    ];
    
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Store user data in localStorage (in real app, use secure session management)
        localStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        }));
        
        return { success: true, user: user };
    } else {
        return { success: false, message: 'Invalid username or password' };
    }
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

// Show message function (legacy support)
function showMessage(message, type) {
    const title = type === 'success' ? 'Success' : 'Error';
    showNotification(type, title, message);
}

// Loading state management
function setLoadingState(loading) {
    if (loading) {
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner"></i> Logging in...';
    } else {
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-arrow-right"></i> Login';
    }
}

// Check if user is already logged in
function checkExistingLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        // Check if login is still valid (e.g., not expired)
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) { // 24-hour session
            showMessage('Already logged in. Redirecting...', 'success');
            setTimeout(() => {
                window.location.replace('dashboard.html');
            }, 1000);
        } else {
            // Session expired
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
    
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

// Real backend integration functions (to be implemented)
class AuthAPI {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }
    
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store authentication token
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
    
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Network error. Please try again.' };
        }
    }
}

// Export for use in other files
window.AuthAPI = AuthAPI;
