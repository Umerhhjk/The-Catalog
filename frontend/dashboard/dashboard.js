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

  // Make sure they are visible
  continuePanel.style.display = '';
  recentPanel.style.display = '';

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
}

function renderBookDetails(book) {
  const main = document.getElementById('mainArea');

  // Hide dashboard panels but don't remove them
  const continuePanel = document.getElementById('continuePanel');
  const recentPanel = document.getElementById('recentPanel');
  if (continuePanel) continuePanel.style.display = 'none';
  if (recentPanel) recentPanel.style.display = 'none';

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

  document.getElementById('logoutBtn').addEventListener('click', () => {
    try { localStorage.removeItem('currentUser'); } catch(e) {}
    window.location.replace('../index.html');
  });
}

document.addEventListener('DOMContentLoaded', mount);
