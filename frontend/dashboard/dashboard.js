let books = [];
let categories = []; 

async function loadCategories() {
  try {
    const res = await fetch("https://library-backend-excpspbhaq-uc.a.run.app/api/books/categories");
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
    const res = await fetch("https://library-backend-excpspbhaq-uc.a.run.app/api/books");
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

// NEW FUNCTION: Search books by name
async function searchBooks(query) {
  try {
    const res = await fetch(`https://library-backend-excpspbhaq-uc.a.run.app/api/books/search?name=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.success && data.books) {
      return data.books.map(b => ({
        id: b.bookid,
        title: b.name,
        img: b.imglink || "",
        category: b.category
      }));
    } else {
      return [];
    }
  } catch (err) {
    console.error("Failed to search books:", err);
    return [];
  }
}

// NEW FUNCTION: Render search results
function renderSearchResults(query, searchResults) {
  const main = document.getElementById('mainArea');

  // Remove all generated panels
  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  // Hide continue panel
  const continuePanel = document.getElementById('continuePanel');
  if (continuePanel) {
    continuePanel.style.display = 'none';
  }

  // Hide settings panel
  if (typeof viewManager !== "undefined") {
    try { viewManager._hide('settings'); } catch (e) {}
  }

  // Remove active state from sidebar items
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

  // Create search results panel
  const panel = document.createElement('section');
  panel.className = 'panel category-panel';
  panel.style.marginBottom = '14px';

  panel.innerHTML = `
    <div class="row-head">
      <div class="row-title">Results for ${query}</div>
    </div>
    <div class="carousel"></div>
  `;

  const row = panel.querySelector('.carousel');

  if (searchResults.length === 0) {
    row.innerHTML = '<div style="color:var(--muted);padding:20px;">No books found matching your search.</div>';
  } else {
    searchResults.forEach((book, i) => {
      row.appendChild(createBookCard(book, i));
    });
  }

  main.appendChild(panel);

  // Update viewManager
  if (typeof viewManager !== "undefined") {
    viewManager.currentView = "search";
    viewManager.previousView = "dashboard";
  }
}

// NEW FUNCTION: Render dynamic sidebar
function renderSidebar() {
  const sidecard = document.querySelector('.sidebar .sidecard');
  if (!sidecard) return;

  // Count books per category
  const categoryCounts = {};
  books.forEach(book => {
    const cat = book.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalBooks = books.length;

  // Build sidebar HTML
  let sidebarHTML = `
    <nav class="nav">
      <a class="nav-item" id="allBooksItem" href="#" data-category="all">
        <span class="label"><i class="fa-solid fa-books"></i>All Books</span>
        <span class="count">${totalBooks}</span>
      </a>
  `;

  // Add each category
  categories.forEach(cat => {
    const count = categoryCounts[cat] || 0;
    sidebarHTML += `
      <a class="nav-item" href="#" data-category="${cat}">
        <span class="label"><i class="fa-solid fa-book-open-reader"></i>${cat}</span>
        <span class="count">${count}</span>
      </a>
    `;
  });

  sidebarHTML += `</nav>`;
  
  sidecard.innerHTML = sidebarHTML;

  // Attach click handlers
  attachSidebarHandlers();
}

// NEW FUNCTION: Attach click handlers to sidebar items
function attachSidebarHandlers() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Clear search input when navigating via sidebar
      const searchInput = document.querySelector('.search input');
      if (searchInput) searchInput.value = '';
      
      // Remove active class from all items
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      // Add active to clicked item
      item.classList.add('active');
      
      const category = item.getAttribute('data-category');
      
      if (category === 'all') {
        // Show all categories (full dashboard)
        renderDashboard();
      } else {
        // Show single category
        renderSingleCategory(category);
      }
    });
  });
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

  // Set All Books as active in sidebar
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const allBooksItem = document.getElementById('allBooksItem');
  if (allBooksItem) allBooksItem.classList.add('active');

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

  // NEW: Setup search functionality
  const searchInput = document.querySelector('.search input');
  if (searchInput) {
    // Handle Enter key press
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          // Perform search
          const searchResults = await searchBooks(query);
          renderSearchResults(query, searchResults);
        } else {
          // If empty, show dashboard
          renderDashboard();
        }
      }
    });

    // Optional: Clear search on Escape key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        renderDashboard();
      }
    });
  }

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
        const detailsPanel = document.getElementById('detailsPanel');
        // Only show continuePanel if there are no books
        if (continuePanel) continuePanel.style.display = books.length === 0 ? 'block' : 'none';
        if (recentPanel) recentPanel.style.display = '';
        if (settingsPanel) settingsPanel.style.display = 'none';
        if (detailsPanel) detailsPanel.style.display = 'none';
      }  else if (viewName === 'settings') {
        const continuePanel = document.getElementById('continuePanel');
        const recentPanel = document.getElementById('recentPanel');
        const settingsPanel = document.getElementById('settingsPanel');
        const detailsPanel = document.getElementById('detailsPanel');
        const main = document.getElementById('mainArea');
        
        // Hide dashboard panels and book details
        if (continuePanel) continuePanel.style.display = 'none';
        if (recentPanel) recentPanel.style.display = 'none';
        if (detailsPanel) detailsPanel.style.display = 'none';
        
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
      
      // Render appropriate view based on target
      if (target === 'dashboard') {
        renderDashboard();
        this._show('dashboard');
      } else if (target === 'bookdetails') {
        // Going back to book details - reload the data in the iframe
        const detailsPanel = document.getElementById('detailsPanel');
        if (detailsPanel) {
          detailsPanel.style.display = 'block';
          // Send message to iframe to reload book data
          const iframe = detailsPanel.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: 'reload-book-data' }, '*');
          }
        }
      } else {
        this._show(this.currentView);
      }
      
      return true;
    }
  };

  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');

  // Settings button
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      viewManager.navigateTo('settings');
    });
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      viewManager.goBack();
    });
  }

  // Cross-tab synchronization
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'catalog-event') {
      // Let modules handle their own updates
      if (SettingsPanel && typeof SettingsPanel.loadPendingRequests === 'function') {
        SettingsPanel.loadPendingRequests();
        SettingsPanel.loadTransactionHistory();
      }
    }
  });

  // Initialize settings panel and profile manager
  if (SettingsPanel && typeof SettingsPanel.init === 'function') {
    SettingsPanel.init(viewManager);
  }
  if (ProfileManager && typeof ProfileManager.init === 'function') {
    ProfileManager.init();
  }

  const API_BASE = localStorage.getItem('API_BASE') || 'https://library-backend-excpspbhaq-uc.a.run.app';
}

document.addEventListener('DOMContentLoaded', async () => {

  await Promise.all([
    loadCategories(),
    loadBooks()
  ]);

  // Render dynamic sidebar after loading data
  renderSidebar();

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

    // Re-render sidebar with updated counts
    renderSidebar();
    renderDashboard();

    showToast('Book added successfully!');
  }

  if (action === 'cancel-btn') {
    uploadOverlay.style.display = 'none';
  }

  if (action === 'booking-changed') {
    // Reload books when booking status changes
    await loadBooks();
    // Update sidebar counts
    renderSidebar();
  }

if (action === 'close-bookdetails') {
    const main = document.getElementById('mainArea');
    if (main) {
      Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
    }

    // Reload books and categories from API
    await loadBooks();
    await loadCategories();

    // Re-render sidebar with updated counts
    renderSidebar();
    // Render updated dashboard
    renderDashboard();

    // Fix URL
    history.replaceState({ id: null }, "", location.pathname);
  }
});