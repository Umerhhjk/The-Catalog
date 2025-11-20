
let books = [];
let categories = []; 

async function loadCategories() {
  try {
    const res = await fetch("http://localhost:5000/api/books/categories");
    const data = await res.json();

    if (data.success && Array.isArray(data.categories)) {
      categories = data.categories;
    } else {
      categories = [];
    }
  } catch (err) {
    console.error("Failed to load categories:", err);
    categories = [];
  }
}


async function loadBooks() {
  try {
    const res = await fetch("http://localhost:5000/api/books");
    const data = await res.json();

    if (data.success && data.books) {
      books = data.books.map(b => ({
        id: b.bookid,
        title: b.name,
        img: b.imglink || "",
        category: b.category
      }));
    } else {
      books = [];
    }
  } catch (err) {
    console.error("Failed to load books:", err);
    books = [];
  }
}

function createBookCard(book, idx) {
  const link = document.createElement('a');
  link.className = 'book-card';
  link.href = `dashboard.html?id=${encodeURIComponent(book.id)}`;

  link.innerHTML = `
    <span class="badge">#${(idx % 9) + 1}</span>
    <div class="cover-placeholder" aria-hidden="true">
      ${book.img
        ? `<img src="${book.img}" alt="${book.title}" class="book-cover-img">`
        : `<span class="cover-initial">${book.title.slice(0,1)}</span>`}
    </div>
    <div class="book-meta">
      <span class="meta-dot"></span>
      <div class="book-title">${book.title}</div>
    </div>`;

  link.addEventListener('click', (e) => {
    e.preventDefault();
    try { localStorage.setItem('selectedBook', JSON.stringify(book)); } catch (e) {}
    navigateTo(`?id=${encodeURIComponent(book.id)}`);
  });

  return link;
}

function fadeOutIn(callback) {
  const main = document.getElementById('mainArea');
  main.style.opacity = '0';
  main.style.transform = 'translateY(6px)';
  setTimeout(() => {
    callback();
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  }, 180);
}

/* =====================================================
   CORRECTED renderDashboard — CONDITIONAL PANEL DISPLAY
   ===================================================== */

function renderDashboard() {
  const main = document.getElementById('mainArea');
  const continuePanel = document.getElementById('continuePanel');

  // Remove only dashboard-generated panels (category panels and details panel)
  // Preserve persistent panels like the settings panel so their tab containers
  // (e.g. `#manage-requests`) remain present when opened.
  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  // If no books, show continue panel; otherwise show category panels
  if (books.length === 0) {
    // Show continue panel for no books available
    if (continuePanel) {
      continuePanel.style.display = 'block';
    }
  } else {
    // Hide continue panel when books exist
    if (continuePanel) {
      continuePanel.style.display = 'none';
    }
    
    // Build fresh category panels
    categories.forEach(category => {
      const panel = document.createElement('section');
      panel.className = 'panel category-panel';
      panel.style.marginBottom = '14px';

      panel.innerHTML = `
        <div class="row-head">
          <div class="row-title">${category}</div>
        </div>
        <div class="carousel"></div>
      `;

      const row = panel.querySelector('.carousel');
      const filteredBooks = books.filter(b => b.category === category);

      filteredBooks.forEach((book, i) => {
        row.appendChild(createBookCard(book, i));
      });

      main.appendChild(panel);
    });
  }

  // Tell viewManager we switched back to dashboard - but DON'T let it override visibility
  if (typeof viewManager !== "undefined") {
    viewManager.currentView = "dashboard";
    viewManager.previousView = null;
  }
}

/* =====================================================
   RENDER SINGLE CATEGORY (when sidebar category clicked)
   ===================================================== */
function renderSingleCategory(categoryName) {
  const main = document.getElementById('mainArea');

  // Remove all generated panels (category panels and details)
  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  // Hide dashboard panels (continue, recent) and settings
  if (typeof viewManager !== "undefined") {
    try { viewManager._hide('dashboard'); } catch (e) {}
    try { viewManager._hide('settings'); } catch (e) {}
  }

  // Create single category panel
  const panel = document.createElement('section');
  panel.className = 'panel category-panel';
  panel.style.marginBottom = '14px';

  panel.innerHTML = `
    <div class="row-head">
      <div class="row-title">${categoryName}</div>
    </div>
    <div class="carousel"></div>
  `;

  const row = panel.querySelector('.carousel');
  const filteredBooks = books.filter(b => b.category === categoryName);

  if (filteredBooks.length === 0) {
    row.innerHTML = '<div style="color:var(--muted);padding:20px;">No books in this category.</div>';
  } else {
    filteredBooks.forEach((book, i) => {
      row.appendChild(createBookCard(book, i));
    });
  }

  main.appendChild(panel);
}


/* ============================================
   SAME renderBookDetails YOU PROVIDED
   ============================================ */

function renderBookDetails(book) {
  const main = document.getElementById('mainArea');

  // FIX: Create a history entry so the Back button works
  history.pushState({ id: book.id }, "", `?id=${encodeURIComponent(book.id)}`);

  // Remove only dashboard-generated panels (category panels and existing details)
  // Preserve persistent UI like the settings panel so tabs remain available.
  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  // Hide continue panel and other dashboard panels
  const continuePanel = document.getElementById('continuePanel');
  if (continuePanel) {
    continuePanel.style.display = 'none';
  }

  // Store book for bookdetails.html
  try { 
    localStorage.setItem('selectedBook', JSON.stringify(book)); 
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    localStorage.setItem('selectedUser', JSON.stringify(currentUser));
  } catch (e) {}

  // Create panel
  const details = document.createElement('div');
  details.id = 'detailsPanel';
  details.style.width = '100%';
  details.style.minHeight = '400px';

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.title = 'Book Details';
  iframe.src = `../bookdetails/bookdetails.html?id=${encodeURIComponent(book.id)}`;
  iframe.style.width = '100%';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';

  details.appendChild(iframe);
  main.appendChild(details);

  // Tell viewManager we switched
  if (typeof viewManager !== 'undefined') {
    viewManager.navigateTo('bookdetails');
  }
}





function navigateTo(search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
  const id = params.get('id');

  if (id) {
    // classic navigation
    const book = books.find(b => b.id === id)
             || JSON.parse(localStorage.getItem('selectedBook') || 'null')
             || { id, title: id.replace(/-/g, ' ') };

    renderBookDetails(book);
    return;
  }

  // dashboard view
  history.pushState({ id: null }, '', `${location.pathname}`);
  renderDashboard();
}


function mount() {
  try {
    const stored = localStorage.getItem('currentUser');
const uEl = document.getElementById('profileUsername');
const nEl = document.getElementById('profileFullname');
const eEl = document.getElementById('profileEmail');

const addBookBtn = document.getElementById('addBookBtn');
const settingsBtn = document.getElementById('settingsBtn');
const profileBtn = document.getElementById('profileBtn');
const logoutBtn = document.getElementById('logoutBtn');

if (stored) {
  const user = JSON.parse(stored);

  // Set profile info
  if (uEl && user.username) uEl.textContent = user.username;
  if (eEl && user.email) eEl.textContent = user.email;
  if (nEl && user.fullName) nEl.textContent = user.fullName;

  // Show/hide buttons based on adminindicator
  if (user.adminindicator) {
    addBookBtn.style.display = '';
    settingsBtn.style.display = '';
    profileBtn.style.display = '';
    logoutBtn.style.display = '';
  } else {
    addBookBtn.style.display = 'none';
    settingsBtn.style.display = 'none';
    profileBtn.style.display = '';
    logoutBtn.style.display = '';
  }

  // Attach logout AFTER visibility decisions
   const logoutButton = document.getElementById('logoutBtn');
   if (logoutButton) {
     logoutButton.onclick = () => {
    try { localStorage.removeItem('currentUser'); } catch (e) {}
      window.location.replace('../index.html');
    };
    }
    } else {  }
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

  document.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const label = a.querySelector('.label');
      if (label) {
        const categoryName = label.textContent.trim();
        // Only render single category if it's a known category
        if (categories.includes(categoryName)) {
          renderSingleCategory(categoryName);
        }
      }
    });
  });

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

  const viewManager = window.viewManager = {
    currentView: 'dashboard',
    previousView: null,
    _show(viewName) {
      if (viewName === 'dashboard') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        const settingsPanel = document.getElementById('settingsPanel');
        if (continuePanel) continuePanel.style.display = '';
        if (recentPanel) recentPanel.style.display = '';
        if (settingsPanel) settingsPanel.style.display = 'none';
      }  else if (viewName === 'settings') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        const settingsPanel = document.getElementById('settingsPanel');
        const main = document.getElementById('mainArea');
        
        // Hide dashboard panels
        if (continuePanel) continuePanel.style.display = 'none';
        if (recentPanel) recentPanel.style.display = 'none';
        
        // Also hide category panels
        if (main) {
          Array.from(main.querySelectorAll('.category-panel')).forEach(n => n.style.display = 'none');
        }
        
        if (settingsPanel) settingsPanel.style.display = 'block';
      }
    },
    _hide(viewName) {
      if (viewName === 'dashboard') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        if (continuePanel) continuePanel.style.display = 'none';
        if (recentPanel) recentPanel.style.display = 'none';
      }  else if (viewName === 'settings') {
        const settingsPanel = document.getElementById('settingsPanel');
        if (settingsPanel) settingsPanel.style.display = 'none';
      }
    },
    navigateTo(viewName) {
      if (!viewName || viewName === this.currentView) return false;
      this._hide(this.currentView);
      this.previousView = this.currentView;
      this.currentView = viewName;
      this._show(this.currentView);
      return true;
    },
    goBack() {
      if (!this.previousView) return false;
      this._hide(this.currentView);
      const target = this.previousView;
      this.previousView = null;
      this.currentView = target;
      
      // Render dashboard content BEFORE showing it
      if (target === 'dashboard') {
        renderDashboard();
      } else {
        this._show(this.currentView);
      }
      
      return true;
    }
  };

  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');
  const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
  const settingsTabContents = document.querySelectorAll('.settings-tab-content');

  // Open settings
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      viewManager.navigateTo('settings');

      // Default tab load
      const container = document.getElementById('manage-requests');
      container.innerHTML =
        '<div style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div style="font-weight:700;">Pending Returns</div><button id="refreshRequestsBtn" class="save-btn" style="padding:6px 12px;font-size:13px;"><i class="fa-solid fa-rotate-right"></i> Refresh</button></div><div id="pendingList"></div></div>';
      pendingInitialized = false;
      lastPendingKey = '';
      loadPendingRequests();

      // Attach refresh button handler
      const refreshBtn = document.getElementById('refreshRequestsBtn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', loadPendingRequests);
      }

    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      viewManager.goBack();
    });
  }

  // Tab switching + data loading
  settingsTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      // Switch UI
      settingsTabBtns.forEach((b) => b.classList.remove('active'));
      settingsTabContents.forEach((content) => content.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      // Load tab-specific data
      if (tabId === 'manage-requests') {
        const container = document.getElementById('manage-requests');
        container.innerHTML =
          '<div style="padding:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div style="font-weight:700;">Pending Returns</div><button id="refreshRequestsBtn" class="save-btn" style="padding:6px 12px;font-size:13px;"><i class="fa-solid fa-rotate-right"></i> Refresh</button></div><div id="pendingList"></div></div>';
        pendingInitialized = false;
        lastPendingKey = '';

        loadPendingRequests();
        
        // Attach refresh button handler
        const refreshBtn = document.getElementById('refreshRequestsBtn');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', loadPendingRequests);
        }
      }
    });
  });

  // Cross-tab synchronization
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'catalog-event' && viewManager.currentView === 'settings') {
      loadPendingRequests();
      loadTransactionHistory();
    }
  });

  // Poll pending requests only (transactions now use manual refresh button)
  setInterval(() => {
    try {
      // Only auto-refresh if on manage-requests tab AND settings panel is visible
      if (viewManager.currentView === 'settings') {
        const manageRequestsTab = document.querySelector('.settings-tab-btn[data-tab="manage-requests"]');
        if (manageRequestsTab && manageRequestsTab.classList.contains('active')) {
          loadPendingRequests();
        }
      }
    } catch (_) {}
  }, 5000);

  const API_BASE = localStorage.getItem('API_BASE') || 'http://localhost:5000';
  let pendingInitialized = false, activeInitialized = false;
  let lastPendingKey = '', lastActiveKey = '';

  async function loadPendingRequests() {
    try {
      const listEl = document.getElementById('pendingList') 
                    || document.getElementById('manage-requests');

      // If element does NOT exist, stop silently.
      if (!listEl) return;

      if (!pendingInitialized) {
        listEl.innerHTML = '<div style="padding:20px;color:var(--muted)">Loading requests...</div>';
      }

      const resp = await fetch(`${API_BASE}/api/bookings?pending=1`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Failed to load');

      const listHtml = document.createElement('div');
      listHtml.style.padding = '12px';

      const key = (data.bookings || [])
        .map(b => `${b.bookingid || b.BookingId}-${b.pendingreturnindicator ?? b.pendingReturnIndicator}`)
        .join('|');

      if (pendingInitialized && key === lastPendingKey) return;

      if (!data.bookings || data.bookings.length === 0) {
        listHtml.innerHTML = '<div style="color:var(--muted)">No pending return requests.</div>';
        listEl.replaceChildren(listHtml);
        lastPendingKey = key;
        pendingInitialized = true;
        return;
      }

      for (const b of data.bookings) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 0';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';

        const info = document.createElement('div');
        const uid = b.userid || b.UserId;
        const bid = b.bookid || b.BookId;

        const [uname, bname] = await Promise.all([
          (async () => {
            try {
              const r = await fetch(`${API_BASE}/api/users?user_id=${encodeURIComponent(uid)}`);
              const d = await r.json();
              return (d.user && (d.user.fullname || d.user.username || d.user.Username)) || uid;
            } catch { return uid; }
          })(),
          (async () => {
            try {
              const r = await fetch(`${API_BASE}/api/books?book_id=${encodeURIComponent(bid)}`);
              const d = await r.json();
              return (d.book && (d.book.name || d.book.Name)) || bid;
            } catch { return bid; }
          })()
        ]);

        info.innerHTML =
          `<div style="font-weight:600">Booking #${b.bookingid || b.BookingId}</div>
          <div style="font-size:12px;color:var(--muted)">
              ${uname} — ${bname} (ID ${bid})
          </div>`;

        const btn = document.createElement('button');
        btn.className = 'save-btn';
        btn.textContent = 'Approve Return';

        btn.addEventListener('click', async () => {
          try {
            const id = b.bookingid || b.BookingId;
            const r = await fetch(`${API_BASE}/api/bookings/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pendingReturnIndicator: false })
            });

            const res = await r.json();

            if (r.ok && res.success) {
              btn.disabled = true;
              btn.textContent = 'Approved';
              localStorage.setItem('catalog-event', 'return-approved:' + Date.now());

              loadPendingRequests();
              loadTransactionHistory();
            } else {
              alert(res.message || 'Approve failed');
            }

          } catch (err) {
            console.error(err);
            alert('Approve failed');
          }
        });

        row.appendChild(info);
        row.appendChild(btn);
        listHtml.appendChild(row);
      }

      // --- Off-screen render for smooth update ---
      const temp = document.createElement('div');
      temp.style.display = 'none';
      document.body.appendChild(temp);

      temp.appendChild(listHtml);

      listEl.replaceChildren(...temp.childNodes);

      document.body.removeChild(temp);

      lastPendingKey = key;
      pendingInitialized = true;

    } catch (err) {
      console.error('Load pending requests error', err);

      const listEl = document.getElementById('pendingList') 
                  || document.getElementById('manage-requests');

      if (!listEl) return;

      listEl.innerHTML = '<div style="padding:20px;color:var(--muted)">Failed to load requests</div>';
    }
  }



  async function loadTransactionHistory() {
    try {
      const container = document.getElementById('transactionsContainer');

      // If tab not rendered yet → exit silently
      if (!container) return;

      container.innerHTML =
        '<div style="padding:20px;color:var(--muted)">Loading transactions...</div>';

      const resp = await fetch(`${API_BASE}/api/transactions`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || 'Failed to load');

      const listHtml = document.createElement('div');
      listHtml.style.padding = '12px';

      if (!data.transactions || data.transactions.length === 0) {
        listHtml.innerHTML = '<div style="color:var(--muted)">No transactions.</div>';
        container.innerHTML = '';
        container.appendChild(listHtml);
        return;
      }

      data.transactions.forEach(t => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '8px 0';
        row.style.borderBottom = '1px solid rgba(255,255,255,0.03)';

        const info = document.createElement('div');
        const date = t.transactiondate || t.TransactionDate;
        const dateStr = date ? new Date(date).toLocaleString() : '';
        const reserved = t.reservedindicator ?? t.ReservedIndicator;

        info.innerHTML =
          `<div style="font-weight:600">Transaction #${t.transactionid || t.TransactionId}</div>
          <div style="font-size:12px;color:var(--muted)">
            User: ${t.userid || t.UserId} — 
            Book: ${t.bookid || t.BookId} — 
            ${dateStr} — 
            ${reserved ? 'Reserved' : 'Returned'}
          </div>`;

        row.appendChild(info);
        listHtml.appendChild(row);
      });

      container.innerHTML = '';
      container.appendChild(listHtml);

    } catch (err) {
      console.error("Transaction history error:", err);

      const container = document.getElementById('transactionsContainer');
      if (!container) return;

      container.innerHTML =
        '<div style="padding:20px;color:var(--muted)">Failed to load transactions</div>';
    }
  }

  // Add refresh button handler for transactions
  const refreshTransactionsBtn = document.getElementById('refreshTransactionsBtn');
  if (refreshTransactionsBtn) {
    refreshTransactionsBtn.addEventListener('click', loadTransactionHistory);
  }

  const editProfileBtn = document.getElementById('editProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const editFullname = document.getElementById('editFullname');
  const editEmail = document.getElementById('editEmail');
  const modalSection = document.querySelector('.modal-section');

  function enterEditMode() {
    modalSection.classList.add('edit-mode');
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      const user = JSON.parse(stored);
      editFullname.value = user.fullName || '';
      editEmail.value = user.email || '';
    }
  }

  function exitEditMode() {
    modalSection.classList.remove('edit-mode');
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

document.addEventListener('DOMContentLoaded', async () => {

  await Promise.all([
    loadCategories(),
    loadBooks()
  ]);

  mount();
});


// =====================
// UPLOAD BUTTON OVERLAY
// =====================

// 1. Create overlay element (hidden by default)
const uploadOverlay = document.createElement('div');
uploadOverlay.id = 'uploadOverlay';
uploadOverlay.style.position = 'fixed';
uploadOverlay.style.top = '0';
uploadOverlay.style.left = '0';
uploadOverlay.style.width = '100vw';
uploadOverlay.style.height = '100vh';
uploadOverlay.style.background = 'rgba(0,0,0,0.65)';
uploadOverlay.style.display = 'none';
uploadOverlay.style.zIndex = '99999';
uploadOverlay.style.backdropFilter = 'blur(4px)';

// Create iframe to load your form
const uploaderFrame = document.createElement('iframe');
uploaderFrame.src = '../bookuploader/uploadbook.html';
uploaderFrame.style.width = '60%';
uploaderFrame.style.height = '95%';
uploaderFrame.style.border = 'none';
uploaderFrame.style.borderRadius = '0px';
uploaderFrame.style.position = 'absolute';
uploaderFrame.style.top = '50%';
uploaderFrame.style.left = '50%';
uploaderFrame.style.transform = 'translate(-50%, -50%)';
uploaderFrame.style.background = '#fff';

// 3. Close overlay on background click
uploadOverlay.addEventListener('click', (e) => {
  if (e.target === uploadOverlay) uploadOverlay.style.display = 'none';
});

// 4. Add iframe inside overlay
uploadOverlay.appendChild(uploaderFrame);
document.body.appendChild(uploadOverlay);

// 5. Trigger → Show overlay
document.getElementById("addBookBtn").addEventListener("click", () => {
  uploadOverlay.style.display = 'block';
});

// ========================
// Toast Function
// ========================
function showToast(message) {
  // Create container if not present
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<strong>${message}</strong>`;

  // Append toast to container
  container.appendChild(toast);

  // Force reflow so animation triggers
  void toast.offsetWidth;

  // Remove toast after 4s
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ========================
// Message Handler (upload, cancel, close-bookdetails)
// ========================
window.addEventListener('message', async (event) => {
  const { action, data } = event.data || {};

  if (action === 'save-btn') {
    uploadOverlay.style.display = 'none';

    // AUTO REFRESH DASHBOARD FROM API
    await loadBooks();
    await loadCategories();

    renderDashboard();

    showToast('Book added successfully!');
  }

  if (action === 'cancel-btn') {
    uploadOverlay.style.display = 'none';
  }

  if (action === 'close-bookdetails') {
    // Remove only generated dashboard panels and any details iframe
    const main = document.getElementById('mainArea');
    if (main) {
      Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
    }

    // Render dashboard directly
    renderDashboard();

    // Fix URL
    history.replaceState({ id: null }, "", location.pathname);
  }
});
