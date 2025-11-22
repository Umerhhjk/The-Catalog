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

function renderSearchResults(query, searchResults) {
  const main = document.getElementById('mainArea');

  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  const continuePanel = document.getElementById('continuePanel');
  if (continuePanel) {
    continuePanel.style.display = 'none';
  }

  if (typeof viewManager !== "undefined") {
    try { viewManager._hide('settings'); } catch (e) {}
  }

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

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

  if (typeof viewManager !== "undefined") {
    viewManager.currentView = "search";
    viewManager.previousView = "dashboard";
  }
}

function renderSidebar() {
  const sidecard = document.querySelector('.sidebar .sidecard');
  if (!sidecard) return;

  const categoryCounts = {};
  books.forEach(book => {
    const cat = book.category || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const totalBooks = books.length;

  let sidebarHTML = `
    <nav class="nav">
      <a class="nav-item" id="allBooksItem" href="#" data-category="all">
        <span class="label"><i class="fa-solid fa-books"></i>All Books</span>
        <span class="count">${totalBooks}</span>
      </a>
  `;

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

  attachSidebarHandlers();
}

function attachSidebarHandlers() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const searchInput = document.querySelector('.search input');
      if (searchInput) searchInput.value = '';
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      const category = item.getAttribute('data-category');
      
      if (category === 'all') {
        renderDashboard();
      } else {
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

  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const allBooksItem = document.getElementById('allBooksItem');
  if (allBooksItem) allBooksItem.classList.add('active');

  if (books.length === 0) {
    if (continuePanel) {
      continuePanel.style.display = 'block';
    }
  } else {
    if (continuePanel) {
      continuePanel.style.display = 'none';
    }
    
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

  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  if (typeof viewManager !== "undefined") {
    try { viewManager._hide('dashboard'); } catch (e) {}
    try { viewManager._hide('settings'); } catch (e) {}
  }

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

  history.pushState({ id: book.id }, "", `?id=${encodeURIComponent(book.id)}`);

  if (main) {
    Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
  }

  const continuePanel = document.getElementById('continuePanel');
  if (continuePanel) {
    continuePanel.style.display = 'none';
  }

  try { 
    localStorage.setItem('selectedBook', JSON.stringify(book)); 
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    localStorage.setItem('selectedUser', JSON.stringify(currentUser));
  } catch (e) {}

  const details = document.createElement('div');
  details.id = 'detailsPanel';
  details.style.width = '100%';
  details.style.minHeight = '400px';

  const iframe = document.createElement('iframe');
  iframe.title = 'Book Details';
  iframe.src = `../bookdetails/bookdetails.html?id=${encodeURIComponent(book.id)}`;
  iframe.style.width = '100%';
  iframe.style.height = '100vh';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';

  details.appendChild(iframe);
  main.appendChild(details);

  if (typeof viewManager !== 'undefined') {
    viewManager.navigateTo('bookdetails');
  }
}


function navigateTo(search) {
  const params = new URLSearchParams(search.startsWith('?') ? search.substring(1) : search);
  const id = params.get('id');

  if (id) {
    const book = books.find(b => b.id === id)
             || JSON.parse(localStorage.getItem('selectedBook') || 'null')
             || { id, title: id.replace(/-/g, ' ') };

    renderBookDetails(book);
    return;
  }

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

  if (user.userid || user.UserId) {
    localStorage.setItem('currentUserId', user.userid || user.UserId);
  }

  if (uEl && user.username) uEl.textContent = user.username;
  if (eEl && user.email) eEl.textContent = user.email;
  if (nEl && user.fullName) nEl.textContent = user.fullName;

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

   const logoutButton = document.getElementById('logoutBtn');
   if (logoutButton) {
     logoutButton.onclick = () => {
    try { localStorage.removeItem('currentUser'); } catch (e) {}
      window.location.replace('../index.html');
    };
    }
    } else {  }
  } catch (e) {}

  const searchInput = document.querySelector('.search input');
  if (searchInput) {
    searchInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          // Perform search
          const searchResults = await searchBooks(query);
          renderSearchResults(query, searchResults);
        } else {
          renderDashboard();
        }
      }
    });

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

  function openProfile(){ 
    overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); 
  }

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
      
      if (target === 'dashboard') {
        renderDashboard();
        this._show('dashboard');
      } else if (target === 'bookdetails') {
        const detailsPanel = document.getElementById('detailsPanel');
        if (detailsPanel) {
          detailsPanel.style.display = 'block';
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

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      viewManager.navigateTo('settings');
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      viewManager.goBack();
    });
  }

  window.addEventListener('storage', (ev) => {
    if (ev.key === 'catalog-event') {
      // Let modules handle their own updates
      if (SettingsPanel && typeof SettingsPanel.loadPendingRequests === 'function') {
        SettingsPanel.loadPendingRequests();
        SettingsPanel.loadTransactionHistory();
      }
    }
  });

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

  renderSidebar();

  mount();
});


// =====================
// UPLOAD BUTTON OVERLAY
// =====================

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
uploadOverlay.style.opacity = '0';
uploadOverlay.style.transition = 'opacity 220ms ease';

const uploaderContainer = document.createElement('div');
uploaderContainer.style.width = '60%';
uploaderContainer.style.height = '95%';
uploaderContainer.style.position = 'absolute';
uploaderContainer.style.top = '50%';
uploaderContainer.style.left = '50%';
uploaderContainer.style.transform = 'translate(-50%, -50%)';
uploaderContainer.style.background = '#0f161a';
uploaderContainer.style.borderRadius = '16px';
uploaderContainer.style.boxShadow = '0 24px 64px rgba(0,0,0,0.5)';
uploaderContainer.style.overflow = 'hidden';
uploaderContainer.style.opacity = '0';
uploaderContainer.style.transition = 'transform 220ms ease, opacity 220ms ease';

const uploaderFrame = document.createElement('iframe');
uploaderFrame.src = '../bookuploader/uploadbook.html';
uploaderFrame.style.width = '100%';
uploaderFrame.style.height = '100%';
uploaderFrame.style.border = 'none';

uploadOverlay.addEventListener('click', (e) => {
  if (e.target === uploadOverlay) {
    uploadOverlay.style.opacity = '0';
    uploaderContainer.style.opacity = '0';
    uploaderContainer.style.transform = 'translate(-50%, -48%)';
    setTimeout(() => { uploadOverlay.style.display = 'none'; }, 220);
  }
});

uploaderContainer.appendChild(uploaderFrame);
uploadOverlay.appendChild(uploaderContainer);
document.body.appendChild(uploadOverlay);

function openUploadOverlay() {
  uploadOverlay.style.display = 'block';
  uploadOverlay.style.opacity = '0';
  uploaderContainer.style.opacity = '0';
  uploaderContainer.style.transform = 'translate(-50%, -48%)';
  void uploadOverlay.offsetWidth;
  uploadOverlay.style.opacity = '1';
  uploaderContainer.style.opacity = '1';
  uploaderContainer.style.transform = 'translate(-50%, -50%)';
}

function closeUploadOverlay() {
  uploadOverlay.style.opacity = '0';
  uploaderContainer.style.opacity = '0';
  uploaderContainer.style.transform = 'translate(-50%, -48%)';
  setTimeout(() => { uploadOverlay.style.display = 'none'; }, 220);
}

document.getElementById("addBookBtn").addEventListener("click", () => {
  openUploadOverlay();
});

// ========================
// Toast Function
// ========================
function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '12px';
    container.style.right = '12px';
    container.style.zIndex = '100001';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<strong>${message}</strong>`;
  toast.style.zIndex = '100002';
  toast.style.pointerEvents = 'auto';

  container.appendChild(toast);

  void toast.offsetWidth;

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
    if (data && data.success) {
      closeUploadOverlay();
      await loadBooks();
      await loadCategories();
      renderSidebar();
      renderDashboard();
      showToast('Book added successfully!');
    } else {
      showToast('Upload failed. Please fill all fields and try again.');
    }
  }

  if (action === 'upload-error') {
    const msg = (event.data && event.data.message) ? event.data.message : 'Upload failed.';
    showToast(msg);
  }

  if (action === 'cancel-btn') {
    closeUploadOverlay();
  }

  if (action === 'booking-changed') {
    await loadBooks();
    renderSidebar();
  }

if (action === 'close-bookdetails') {
    const main = document.getElementById('mainArea');
    if (main) {
      Array.from(main.querySelectorAll('.category-panel, #detailsPanel')).forEach(n => n.remove());
    }

    await loadBooks();
    await loadCategories();

    renderSidebar();
    renderDashboard();

    history.replaceState({ id: null }, "", location.pathname);
  }
});