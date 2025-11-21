// ========================
// PROFILE MANAGER MODULE
// ========================
// Handles profile editing + updates

const ProfileManager = (() => {
    const API_URL = "https://library-backend-excpspbhaq-uc.a.run.app/api";

    async function init() {
        const userId = localStorage.getItem('currentUserId');

        if (!userId) {
            console.error("No logged-in user found.");
            return;
        }

        await loadUserProfile(userId);

        document.getElementById("editProfileBtn")?.addEventListener("click", enterEditMode);
        document.getElementById("cancelEditBtn")?.addEventListener("click", exitEditMode);
        document.getElementById("saveEditBtn")?.addEventListener("click", saveProfileChanges);

        const changeBtn = document.getElementById("changePasswordBtn");
        if (changeBtn) changeBtn.addEventListener("click", handleChangePassword);
    }

    async function loadUserProfile(userId) {
        try {
            const response = await fetch(`${API_URL}/users?user_id=${userId}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                console.error("Failed to load user from DB");
                return;
            }

            const user = data.user;

            localStorage.setItem('currentUser', JSON.stringify({
                userid: user.userid,
                username: user.username,
                email: user.email,
                adminindicator: user.adminindicator
            }));

            const usernameEl = document.getElementById("profileUsername");
            if (usernameEl) usernameEl.textContent = user.username;
            const emailEl = document.getElementById("profileEmail");
            if (emailEl) emailEl.textContent = user.email;
            const roleEl = document.getElementById("profileRole");
            if (roleEl) roleEl.textContent = user.adminindicator ? "Librarian" : "Student";

            const editEmailEl = document.getElementById("editEmail");
            if (editEmailEl) editEmailEl.value = user.email;
            const editUsernameEl = document.getElementById("editUsername");
            if (editUsernameEl) editUsernameEl.value = user.username;

        } catch (err) {
            console.error("Error loading profile:", err);
        }
    }

    function enterEditMode() {
        document.querySelector(".modal-section")?.classList.add("edit-mode");
    }

    function exitEditMode() {
        document.querySelector(".modal-section")?.classList.remove("edit-mode");
    }

    async function saveProfileChanges() {
        const email = document.getElementById("editEmail").value.trim();
        const username = document.getElementById("editUsername").value.trim();
        const userId = localStorage.getItem("currentUserId");

        if (!email || !username) {
            alert("Email and username are required");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Username: username,
                    Email: email
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert("Failed to update profile");
                return;
            }

            // Reload current user from DB
            await loadUserProfile(userId);

            exitEditMode();

        } catch (err) {
            console.error("Error updating profile:", err);
        }
    }

    async function handleChangePassword() {
        const currentPassword = document.getElementById("currentPassword")?.value.trim();
        const newPassword = document.getElementById("newPassword")?.value.trim();
        const confirmPassword = document.getElementById("confirmPassword")?.value.trim();
        const errorEl = document.getElementById("passwordError");

        const user = (() => { try { return JSON.parse(localStorage.getItem('currentUser')||'{}'); } catch { return {}; } })();
        const username = user.username || user.Username;

        if (!username) {
            if (errorEl) { errorEl.textContent = 'Not logged in. Please re-login.'; errorEl.style.display = 'block'; }
            return;
        }

        const validation = typeof validateChangePasswordForm === 'function'
            ? validateChangePasswordForm(currentPassword, newPassword, confirmPassword)
            : { isValid: !!(currentPassword && newPassword && confirmPassword), message: 'All fields are required' };

        if (!validation.isValid) {
            if (errorEl) { errorEl.textContent = validation.message; errorEl.style.display = 'block'; }
            return;
        }

        try {
            const resp = await (typeof changePasswordAPI === 'function'
                ? changePasswordAPI(username, currentPassword, newPassword)
                : fetch(`${API_URL}/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, currentPassword, newPassword })
                }));

            const data = await resp.json();
            if (resp.ok && data.success) {
                if (errorEl) { errorEl.style.display = 'none'; errorEl.textContent = ''; }
                if (typeof showNotification === 'function') {
                    showNotification('success', 'Password Changed', 'Your password has been updated.');
                }
                const cp = document.getElementById("currentPassword");
                const np = document.getElementById("newPassword");
                const cfp = document.getElementById("confirmPassword");
                if (cp) cp.value = '';
                if (np) np.value = '';
                if (cfp) cfp.value = '';
            } else {
                const msg = data && data.message ? data.message : 'Failed to change password';
                if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
                if (typeof showNotification === 'function') {
                    showNotification('error', 'Change Password Failed', msg);
                }
            }
        } catch (err) {
            console.error('Change password error:', err);
            if (errorEl) { errorEl.textContent = 'Server unreachable. Please try again.'; errorEl.style.display = 'block'; }
            if (typeof showNotification === 'function') {
                showNotification('error', 'Change Password Failed', 'Server unreachable. Please try again.');
            }
        }
    }

    return { init };
})();
