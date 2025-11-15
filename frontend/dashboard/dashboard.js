// Simple static book data (frontend only)
const books = [
  { id: 'zen-speaks', title: 'Zen Speaks' },
  { id: 'gunsmith', title: 'The Gunsmith' },
  { id: 'blackout', title: 'Blackout' },
  { id: 'newjack', title: 'Newjack' },
  { id: '1984', title: '1984' },
  { id: 'yellow-world', title: 'The Yellow World' },
  { id: 'liberty', title: 'On Liberty' },
  { id: 'anna-karenina', title: 'Anna Karenina' }
];

function createBookCard(book, idx) {
  const link = document.createElement('a');
  link.className = 'book-card';
  link.href = `dashboard.html?id=${encodeURIComponent(book.id)}`;
  link.innerHTML = `
    <span class="badge">#${(idx % 9) + 1}</span>
    <div class="cover-placeholder" aria-hidden="true">
      <span class="cover-initial">${book.title.slice(0,1)}</span>
    </div>
    <div class="book-meta">
      <span class="meta-dot"></span>
      <div class="book-title">${book.title}</div>
      <i class="fa-solid fa-ellipsis-vertical menu"></i>
    </div>`;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    try { localStorage.setItem('selectedBook', JSON.stringify(book)); } catch (e) {}
    navigateTo(`?id=${encodeURIComponent(book.id)}`);
  });
  return link;
}

function fadeOutIn(callback){
  const main = document.getElementById('mainArea');
  main.style.opacity = '0';
  main.style.transform = 'translateY(6px)';
  setTimeout(() => {
    callback();
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  }, 180);
}

// --- Replace renderDashboard and renderBookDetails with these versions ---

function renderDashboard(){
  const main = document.getElementById('mainArea');

  // Remove detailsPanel only if it exists (we'll recreate on demand)
  const existingDetails = document.getElementById('detailsPanel');
  if (existingDetails) existingDetails.remove();

  // Ensure dashboard panels exist (if you accidentally cleared main earlier they will need to be re-created
  // — but in this approach we never wipe main, so this is just safe-guarding).
  let continuePanel = document.getElementById('continuePanel');
  let recentPanel = document.getElementById('recentPanel');

  // If panels are missing (edge case), create simple containers
  if (!continuePanel) {
    continuePanel = document.createElement('div');
    continuePanel.id = 'continuePanel';
    main.appendChild(continuePanel);
  }
  if (!recentPanel) {
    recentPanel = document.createElement('div');
    recentPanel.id = 'recentPanel';
    main.appendChild(recentPanel);
  }

  // Populate lists (clear first)
  const continueRow = document.getElementById('continueRow') || (() => {
    const r = document.createElement('div'); r.id = 'continueRow'; continuePanel.appendChild(r); return r;
  })();
  continueRow.innerHTML = '';
  books.slice(0, 8).forEach((b, i) => continueRow.appendChild(createBookCard(b, i)));

  const recentGrid = document.getElementById('recentGrid') || (() => {
    const g = document.createElement('div'); g.id = 'recentGrid'; recentPanel.appendChild(g); return g;
  })();
  recentGrid.innerHTML = '';
  books.slice(0, 8).forEach((b, i) => recentGrid.appendChild(createBookCard(b, i)));

  // Navigate to dashboard view using ViewManager
  if (typeof viewManager !== 'undefined') {
    viewManager.navigateTo('dashboard');
  }
}

function renderBookDetails(book) {
  const main = document.getElementById('mainArea');

  // Create (or reuse) detailsPanel inside mainArea
  let details = document.getElementById('detailsPanel');
  if (!details) {
    details = document.createElement('div');
    details.id = 'detailsPanel';
    // keep detailsPanel full width/height as needed
    details.style.width = '100%';
    details.style.minHeight = '400px';
    main.appendChild(details);
  } else {
    details.innerHTML = ''; // clear previous
  }

  // Use iframe to load the book details page (this avoids fetching/injecting full document
  // which would remove your dashboard DOM nodes)
  const iframe = document.createElement('iframe');
  iframe.title = 'Book Details';
  iframe.src = `../bookdetails/bookdetails.html?id=${encodeURIComponent(book.id)}`;
  iframe.style.width = '100%';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';

  details.appendChild(iframe);

  // store selection (optional)
  try { localStorage.setItem('selectedBook', JSON.stringify(book)); } catch (e) {}

  // Navigate to bookdetails view using ViewManager
  if (typeof viewManager !== 'undefined') {
    viewManager.navigateTo('bookdetails');
  }
}



function navigateTo(search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
  const id = params.get('id');

  // Always push state, even for dashboard view
  history.pushState({ id: id || null }, '', `${location.pathname}${search || ''}`);

  fadeOutIn(() => {
    if (id) {
      const match =
        books.find(b => b.id === id) ||
        JSON.parse(localStorage.getItem('selectedBook') || 'null') ||
        { id, title: id.replace(/-/g, ' ') };
      renderBookDetails(match);
    } else {
      renderDashboard();
    }
  });
}


function mount() {
  try {
    const stored = localStorage.getItem('currentUser');
    const uEl = document.getElementById('profileUsername');
    const nEl = document.getElementById('profileFullname');
    const eEl = document.getElementById('profileEmail');
    if (stored) {
      const user = JSON.parse(stored);
      if (uEl && user.username) uEl.textContent = user.username;
      if (eEl && user.email) eEl.textContent = user.email;
      if (nEl && user.fullName) nEl.textContent = user.fullName;
    }
  } catch (e) {}

  const initialParams = new URLSearchParams(window.location.search);
  const initialId = initialParams.get('id');
  if (initialId) {
    const fromList = books.find(b => b.id === initialId);
    if (fromList) renderBookDetails(fromList);
    else {
      try {
        const cached = JSON.parse(localStorage.getItem('selectedBook') || 'null');
        renderBookDetails(cached && cached.id === initialId ? cached : { id: initialId, title: initialId.replace(/-/g,' ') });
      } catch { renderBookDetails({ id: initialId, title: initialId }); }
    }
  } else {
    renderDashboard();
    if (!history.state) {
  const params = new URLSearchParams(location.search);
  // Ensure the initial history state is present for reliable back/forward
const initialParams = new URLSearchParams(window.location.search);
history.replaceState({ id: initialParams.get('id') || null }, '', location.href);

}
  }

window.addEventListener('popstate', (evt) => {
  const id = evt.state && evt.state.id
    ? evt.state.id
    : new URLSearchParams(location.search).get('id');

  fadeOutIn(() => {
    if (id) {
      const match =
        books.find(b => b.id === id) ||
        JSON.parse(localStorage.getItem('selectedBook') || 'null') ||
        { id, title: id.replace(/-/g, ' ') };
      renderBookDetails(match);
    } else {
      renderDashboard();
    }
  });
});


  document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  const hamburger = document.getElementById('hamburger');
  const app = document.querySelector('.app');
  const backdrop = document.getElementById('backdrop');
  function closeMobile(){ document.body.classList.remove('mobile-open'); backdrop.hidden = true; hamburger.classList.remove('active'); }
  hamburger.addEventListener('click', () => {
    if (window.innerWidth <= 992) {
      document.body.classList.toggle('mobile-open');
      backdrop.hidden = !document.body.classList.contains('mobile-open');
      hamburger.classList.toggle('active', document.body.classList.contains('mobile-open'));
    } else {
      app.classList.toggle('hide-sidebar');
      hamburger.classList.toggle('active', app.classList.contains('hide-sidebar'));
    }
  });
  backdrop.addEventListener('click', closeMobile);

  const overlay = document.getElementById('profileOverlay');
  const profileBtn = document.getElementById('profileBtn');
  const profileClose = document.getElementById('profileClose');
  function openProfile(){ overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); }
  function closeProfile(){ overlay.classList.remove('open'); overlay.setAttribute('aria-hidden','true'); }
  profileBtn.addEventListener('click', openProfile);
  profileClose.addEventListener('click', closeProfile);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeProfile(); });
  // ============================================================
  // SIMPLE VIEW MANAGER (no stack) - uses current/previous only
  // ============================================================
  // We intentionally keep this minimal: a `currentView` and `previousView`.
  // This removes the stack-based navigation and restores a simple back behavior.

  const viewManager = window.viewManager = {
    currentView: 'dashboard',
    previousView: null,

    // map view names to show/hide handlers
    _show(viewName) {
      if (viewName === 'dashboard') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        if (continuePanel) continuePanel.style.display = '';
        if (recentPanel) recentPanel.style.display = '';
      } else if (viewName === 'bookdetails') {
        const detailsPanel = document.getElementById('detailsPanel');
        if (detailsPanel) detailsPanel.style.display = '';
      } else if (viewName === 'settings') {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.style.display = 'block';
      }
    },

    _hide(viewName) {
      if (viewName === 'dashboard') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        if (continuePanel) continuePanel.style.display = 'none';
        if (recentPanel) recentPanel.style.display = 'none';
      } else if (viewName === 'bookdetails') {
        const detailsPanel = document.getElementById('detailsPanel');
        if (detailsPanel) detailsPanel.style.display = 'none';
      } else if (viewName === 'settings') {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.style.display = 'none';
      }
    },

    navigateTo(viewName) {
      if (!viewName || viewName === this.currentView) return false;
      // hide current
      this._hide(this.currentView);
      // set previous and current
      this.previousView = this.currentView;
      this.currentView = viewName;
      // show new
      this._show(this.currentView);
      return true;
    },

    goBack() {
      if (!this.previousView) {
        console.warn('No previous view to go back to');
        return false;
      }
      // hide current and show previous
      this._hide(this.currentView);
      const target = this.previousView;
      this.previousView = null;
      this.currentView = target;
      this._show(this.currentView);
      return true;
    }
  };

  // Settings Panel Functionality - Now using ViewManager
  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');
  const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
  const settingsTabContents = document.querySelectorAll('.settings-tab-content');

  settingsBtn.addEventListener('click', () => viewManager.navigateTo('settings'));
  backBtn.addEventListener('click', () => viewManager.goBack());

  // Settings Tab switching
  settingsTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Remove active class from all tabs
      settingsTabBtns.forEach((b) => b.classList.remove('active'));
      settingsTabContents.forEach((content) => content.classList.remove('active'));
      
      // Add active class to clicked tab
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Profile Edit Functionality
  const editProfileBtn = document.getElementById('editProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const editFullname = document.getElementById('editFullname');
  const editEmail = document.getElementById('editEmail');
  const modalSection = document.querySelector('.modal-section');

  function enterEditMode() {
    modalSection.classList.add('edit-mode');
    // Populate edit fields with current values
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      editFullname.value = user.fullName || '';
      editEmail.value = user.email || '';
    }
  }

  function exitEditMode() {
    modalSection.classList.remove('edit-mode');
    // Clear edit fields
    editFullname.value = '';
    editEmail.value = '';
  }

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

  editProfileBtn.addEventListener('click', enterEditMode);
  cancelEditBtn.addEventListener('click', exitEditMode);
  saveEditBtn.addEventListener('click', saveProfileChanges);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    try { localStorage.removeItem('currentUser'); } catch(e) {}
    window.location.replace('../index.html');
  });

  // Change Password Functionality
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const currentPasswordInput = document.getElementById('currentPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordError = document.getElementById('passwordError');

  // Show password error message
  function showPasswordError(message) {
    passwordError.textContent = message;
    passwordError.style.display = 'block';
  }

  // Hide password error message
  function hidePasswordError() {
    passwordError.style.display = 'none';
  }

  // Change password handler
  async function handleChangePassword() {
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

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

  // Add event listener to change password button
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
}

document.addEventListener('DOMContentLoaded', mount);
