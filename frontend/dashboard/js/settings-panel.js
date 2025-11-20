// ========================
// SETTINGS PANEL MODULE
// ========================
// Handles all settings panel functionality including:
// - Pending requests management
// - Transaction history
// - Tab switching
// - Auto-refresh and manual refresh

const SettingsPanel = (() => {
  const API_BASE = localStorage.getItem('API_BASE') || 'https://library-backend-excpspbhaq-uc.a.run.app';
  let pendingInitialized = false;
  let lastPendingKey = '';

  // Initialize settings panel event listeners
  function init(viewManager) {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
    const refreshTransactionsBtn = document.getElementById('refreshTransactionsBtn');

    // Open settings panel
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

    // Tab switching + data loading
    settingsTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        const settingsTabContents = document.querySelectorAll('.settings-tab-content');

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

    // Refresh transactions button
    if (refreshTransactionsBtn) {
      refreshTransactionsBtn.addEventListener('click', loadTransactionHistory);
    }

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
  }

  // Load pending return requests
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

  // Load transaction history
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

  // Public API
  return {
    init,
    loadPendingRequests,
    loadTransactionHistory
  };
})();
