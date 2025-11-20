// ========================
// PROFILE MANAGER MODULE
// ========================
// Handles all profile-related functionality:
// - Profile editing
// - Password changes
// - Profile updates to backend

const ProfileManager = (() => {
  // Initialize profile management
  function init() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const modalSection = document.querySelector('.modal-section');

    // Profile editing events
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', enterEditMode);
    }
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', exitEditMode);
    }
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', saveProfileChanges);
    }

    // Password change events
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', handleChangePassword);
    }

    // Add Enter key support for password form
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            handleChangePassword();
          }
        });
      }
    });

    // Helper references
    const editFullname = document.getElementById('editFullname');
    const editEmail = document.getElementById('editEmail');

    // Enter edit mode
    function enterEditMode() {
      modalSection.classList.add('edit-mode');
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        editFullname.value = user.fullName || '';
        editEmail.value = user.email || '';
      }
    }

    // Exit edit mode
    function exitEditMode() {
      modalSection.classList.remove('edit-mode');
      editFullname.value = '';
      editEmail.value = '';
    }

    // Save profile changes
    function saveProfileChanges() {
      const fullName = editFullname.value.trim();
      const email = editEmail.value.trim();

      // Basic validation
      if (!fullName) {
        alert('Full name is required');
        return;
      }
      if (!email) {
        alert('Email is required');
        return;
      }
      if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }

      // Update user data in localStorage
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const user = JSON.parse(stored);
          user.fullName = fullName;
          user.email = email;
          localStorage.setItem('currentUser', JSON.stringify(user));
          
          // Update display
          document.getElementById('profileFullname').textContent = fullName;
          document.getElementById('profileEmail').textContent = email;
          
          // Call backend API to update profile
          updateUserProfile(user);
          
          exitEditMode();
        }
      } catch (e) {
        console.error('Error saving profile:', e);
        alert('Error saving profile changes');
      }
    }

    // Handle password change
    async function handleChangePassword() {
      const currentPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();
      const passwordError = document.getElementById('passwordError');

      // Clear previous errors
      hidePasswordError();

      // Use validation function from authentication.js
      const validation = validateChangePasswordForm(currentPassword, newPassword, confirmPassword);
      if (!validation.isValid) {
        showPasswordError(validation.message);
        return;
      }

      // Set loading state
      const originalText = changePasswordBtn.innerHTML;
      changePasswordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span style="margin-left:8px;">Changing...</span>';
      changePasswordBtn.disabled = true;

      try {
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.username) {
          throw new Error('User session not found');
        }

        // Use API function from authentication.js
        const response = await changePasswordAPI(currentUser.username, currentPassword, newPassword);
        const data = await response.json();

        if (response.ok && data.success) {
          // Success - clear form and show success message
          currentPasswordInput.value = '';
          newPasswordInput.value = '';
          confirmPasswordInput.value = '';
          showPasswordError('Password changed successfully!');
          passwordError.style.color = '#22c55e';
          
          // Hide success message after 3 seconds
          setTimeout(() => {
            hidePasswordError();
          }, 3000);
        } else {
          showPasswordError(data.message || 'Failed to change password');
        }
      } catch (error) {
        console.error('Password change error:', error);
        showPasswordError('Server error. Please try again.');
      } finally {
        // Reset button state
        changePasswordBtn.innerHTML = originalText;
        changePasswordBtn.disabled = false;
      }
    }

    // Show password error message
    function showPasswordError(message) {
      const passwordError = document.getElementById('passwordError');
      passwordError.textContent = message;
      passwordError.style.display = 'block';
    }

    // Hide password error message
    function hidePasswordError() {
      const passwordError = document.getElementById('passwordError');
      passwordError.style.display = 'none';
    }
  }

  // Update user profile on backend
  async function updateUserProfile(user) {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          fullName: user.fullName,
          email: user.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile on server:', error);
      // Note: We don't show an error to user since localStorage was updated
    }
  }

  // Public API
  return {
    init,
    updateUserProfile
  };
})();
