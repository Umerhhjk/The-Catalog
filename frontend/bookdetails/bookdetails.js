const API_BASE = "http://localhost:5000";

// ----------------- Toast helper -----------------
function ensureToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(title, message) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong>${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}


// ----------------- Data objects (dummy for now) -----------------
const Author = {
  AuthorId: 1,
  AuthorName: "Max Simon Nordau",
  AuthorBio: `Max Nordau (1849–1923) was a Hungarian physician, author, and social critic best known for his work *Degeneration*, where he critiqued modern art and culture.`
};

const Publisher = {
  PublisherId: 1,
  PublisherName: "University of Nebraska"
};

const Book = {
  BookId: 4,
  Name: "Degeneration",
  AuthorID: Author.AuthorId,
  Category: "Literary Criticism",
  Genre: "Nonfiction",
  PublisherID: Publisher.PublisherId,
  PublishDate: "1993-11-01",
  Language: "English",
  PageCount: 566,
  CopiesAvailable: 30,
  ImgLink: "temp.png",
  RatedType: "E for Everyone",
  Description: `Max Nordau's *Degeneration* is a landmark study of fin-de-siècle culture. 
  In this provocative work, Nordau critiques modernist art and literature, arguing that the 
  aesthetic trends of the time reflected a cultural and moral decline. He links the 
  decadence of European society with the psychological states of its leading artists. 
  This dummy text continues with additional filler to simulate a long description for testing purposes. 
  It elaborates on ideas of hysteria, neurosis, and artistic excess — the main themes Nordau identified 
  in figures such as Nietzsche and Oscar Wilde.`,
  Rating: 4.3,
  UsersRated: 1200
};

const userData = {
  booked: 0,
  pendingreturn: 0,
  personalRating: 0,
  wishlisted: 0
};

// ----------------- Populate DOM from objects -----------------
function populateDetails() {
  const imgEl = document.getElementById("book-img");
  if (imgEl) imgEl.src = Book.ImgLink;

  document.getElementById("book-name").textContent = Book.Name;
  document.getElementById("book-author").textContent = Author.AuthorName;
  document.getElementById("book-category").textContent = Book.Category;
  document.getElementById("book-genre").textContent = Book.Genre;
  document.getElementById("book-publisher").textContent = Publisher.PublisherName;
  document.getElementById("book-publishdate").textContent = Book.PublishDate;
  document.getElementById("book-language").textContent = Book.Language;
  document.getElementById("book-pagecount").textContent = Book.PageCount;
  document.getElementById("book-copies").textContent = Book.CopiesAvailable;
  document.getElementById("book-rating").textContent = `${Book.Rating.toFixed(1)}/5`;
  document.getElementById("book-usersrated").textContent = `${Book.UsersRated} users`;
  document.getElementById("book-rated").textContent = Book.RatedType;
}
populateDetails();

// ----------------- Elements -----------------
const bookButton = document.getElementById("book-button");
const wishlistButton = document.getElementById("wishlist-button");

// ----------------- Button state management -----------------
function updateButtonState() {
  if (!bookButton) return;
  bookButton.classList.remove("green", "grey", "orange", "darkgreen");
  bookButton.disabled = false;

  if (Book.CopiesAvailable <= 0 && userData.booked === 0) {
    bookButton.textContent = "Book";
    bookButton.classList.add("darkgreen");
    bookButton.disabled = true;
    return;
  }

  if (userData.pendingreturn === 0 && userData.booked === 0) {
    bookButton.textContent = "Book";
    bookButton.classList.add("green");
  } else if (userData.pendingreturn === 0 && userData.booked === 1) {
    bookButton.textContent = "Return";
    bookButton.classList.add("grey");
  } else if (userData.pendingreturn === 1 && userData.booked === 1) {
    bookButton.textContent = "Pending Return";
    bookButton.classList.add("orange");
    bookButton.disabled = true;
  }

  const copiesEl = document.getElementById("book-copies");
  if (copiesEl) copiesEl.textContent = Book.CopiesAvailable;
}

// ----------------- Booking / Return logic -----------------
if (bookButton) {
  bookButton.addEventListener("click", () => {

    const isBooking = (userData.booked === 0 && userData.pendingreturn === 0 && Book.CopiesAvailable > 0);
    const isReturnRequest = (userData.booked === 1 && userData.pendingreturn === 0);

    // -------------------------------------------------------
    // 1. BOOKING FLOW
    // -------------------------------------------------------
    if (isBooking) {
      (async () => {
        try {
          // Get logged-in user
          const currentUser = JSON.parse(
            sessionStorage.getItem('selectedUser') ||
            sessionStorage.getItem('currentUser') ||
            localStorage.getItem('selectedUser') ||
            localStorage.getItem('currentUser') ||
            'null'
          );

          if (!currentUser) {
            showToast('Error', 'Please sign in to book');
            return;
          }

          const userId = currentUser.userid || currentUser.UserId || currentUser.username;
          const bookId = Book.BookId || Book.BookID || Book.id;

          const due = new Date();
          due.setDate(due.getDate() + 14);
          const dueDate = due.toISOString().replace('T', ' ').split('.')[0];

          // Create booking (backend auto-deletes reservation if one exists for this user/book)
          const bookingRes = await fetchJson(`${API_BASE}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ UserId: userId, BookId: bookId, dueDate })
          });

          userData.booked = 1;
          userData.reservationId = null;
          userData.wishlisted = 0;
          Book.CopiesAvailable = Math.max(0, Book.CopiesAvailable - 1);
          userData.bookingId = bookingRes.booking_id || bookingRes.bookingId;

          updateWishlistUI();
          populateDetails();
          updateButtonState();
          localStorage.setItem('catalog-event', 'booking-created:' + Date.now());
          showToast("Booking Confirmed", "Book reserved successfully.");

        } catch (err) {
          console.error("Booking error:", err);
          showToast("Error", err.message || "Booking failed");
        }
      })();

      return;
    }


    // -------------------------------------------------------
    // 2. RETURN REQUEST FLOW
    // -------------------------------------------------------
    if (isReturnRequest) {
      (async () => {
        try {
          if (!userData.bookingId) {
            showToast('Error', 'Booking ID missing');
            return;
          }

          const resp = await fetch(`${API_BASE}/api/bookings/${userData.bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              CurrentlyBookedIndicator: false,
              pendingReturnIndicator: true
            })
          });

          const data = await resp.json();

          if (resp.ok && data.success) {
            userData.pendingreturn = 1;
            updateButtonState();
            localStorage.setItem('catalog-event', 'return-requested:' + Date.now());
            showToast("Return Request", "Return request sent to admin.");
          } else {
            showToast('Error', data?.message || 'Return failed');
          }

        } catch (err) {
          console.error("Return request error:", err);
          showToast("Error", "Return request failed");
        }
      })();

      return;
    }

  });
}


// ----------------- Wishlist logic -----------------
function updateWishlistUI() {
  if (!wishlistButton) return;
  if (userData.wishlisted === 1) wishlistButton.classList.add("active");
  else wishlistButton.classList.remove("active");
}

if (wishlistButton) {
  wishlistButton.addEventListener("click", () => {
    userData.wishlisted = userData.wishlisted ? 0 : 1;
    updateWishlistUI();

    (async () => {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('selectedUser') || sessionStorage.getItem('currentUser') || localStorage.getItem('selectedUser') || localStorage.getItem('currentUser') || 'null');
        if (!currentUser) { showToast('Error','Please sign in to use wishlist'); return; }
        const userId = currentUser.userid || currentUser.UserId || currentUser.username || null;
        const bookId = Book.BookId || Book.BookID || Book.id || Book.BookId;

        if (userData.wishlisted) {
          const data = await fetchJson(`${API_BASE}/api/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ UserId: userId, BookId: bookId })
          });
          // Extract reservation ID — try multiple key formats
          userData.reservationId = data.reservation_id || data.reservationId || data.ReservationId || data.ReservationID;
          console.log('Reservation ID stored:', userData.reservationId, 'Full response:', data);
          showToast("Wishlist Added", "Book added to your wishlist.");
        } else {
          // remove reservation if we have id
          if (userData.reservationId) {
            await fetchJson(`${API_BASE}/api/reservations/${userData.reservationId}`, { method: 'DELETE' });
            userData.reservationId = null;
          } else {
            // fallback: try to find by user reservations
            const list = await fetchJson(`${API_BASE}/api/reservations?user_id=${encodeURIComponent(userId)}`);
            if (list && list.reservations) {
              const r = list.reservations.find(r => (r.bookid || r.BookId || r.BookID) == bookId);
              if (r) {
                const rid = r.reservationid || r.ReservationId || r.ReservationID;
                if (rid) await fetchJson(`${API_BASE}/api/reservations/${rid}`, { method: 'DELETE' });
              }
            }
          }
          showToast("Wishlist Removed", "Book removed from your wishlist.");
        }
      } catch (err) {
        console.error('Wishlist error', err);
        showToast('Error', err.message || 'Wishlist operation failed');
      }
    })();
  });
}


// ----------------- STAR RATING (green fill + updates book rating) -----------------
const stars = document.querySelectorAll('.star');
let persistentRating = userData.personalRating || 0;
let hasRatedBefore = userData.personalRating > 0;

function updateStars() {
  if (!stars) return;
  stars.forEach(star => {
    const val = parseInt(star.dataset.value, 10);
    if (val <= persistentRating) {
      star.classList.add('filled');
      star.textContent = '★';
    } else {
      star.classList.remove('filled');
      star.textContent = '☆';
    }
  });
}

if (stars && stars.length) {
  stars.forEach(star => {
    const val = parseInt(star.dataset.value, 10);

    star.addEventListener('mouseover', () => {
      stars.forEach(s => {
        const v = parseInt(s.dataset.value, 10);
        s.textContent = v <= val ? '★' : '☆';
        s.classList.toggle('filled', v <= val);
      });
    });

    star.addEventListener('mouseout', updateStars);

    star.addEventListener('click', () => {
      const oldRating = userData.personalRating;
      persistentRating = val;
      userData.personalRating = val;

      if (!hasRatedBefore) {
        Book.UsersRated += 1;
        Book.Rating = ((Book.Rating * (Book.UsersRated - 1)) + val) / Book.UsersRated;
        hasRatedBefore = true;
      } else {
        Book.Rating = ((Book.Rating * Book.UsersRated) - oldRating + val) / Book.UsersRated;
      }

      document.getElementById("book-rating").textContent = `${Book.Rating.toFixed(1)}/5`;
      document.getElementById("book-usersrated").textContent = `${Book.UsersRated} users`;

      updateStars();
      showToast("Rating Saved", `You rated this ${persistentRating} star${persistentRating>1?'s':''}.`);
    });
  });
}
updateStars();

// ----------------- Admin simulation: approve return -----------------
window.adminApproveReturn = function() {
  if (userData.pendingreturn === 1 && userData.booked === 1) {
    userData.booked = 0;
    userData.pendingreturn = 0;
    Book.CopiesAvailable = Book.CopiesAvailable + 1;

    populateDetails();
    updateButtonState();
    showToast("Return Completed", "Admin approved your return.");
  }
};

// ----------------- Initial UI sync -----------------
updateWishlistUI();
updateButtonState();

// ----------------- Description box logic -----------------
const descText = document.getElementById("description-text");
const toggleBtn = document.getElementById("toggle-description");

const fullText = Book.Description;
const shortText = fullText.split(" ").slice(0, 60).join(" ") + "...";

let expanded = false;
descText.textContent = shortText;

toggleBtn.addEventListener("click", () => {
  expanded = !expanded;
  descText.textContent = expanded ? fullText : shortText;
  toggleBtn.textContent = expanded ? "Show less" : "Show more";
});

// ----------------- ADMIN BUTTON VISIBILITY -----------------
let AdminIndicator = 0;
let currentUserId = null;

try {
  const currentUser = JSON.parse(localStorage.getItem('selectedUser'));
  if (currentUser) {
    AdminIndicator = currentUser.adminindicator ? 1 : 0;
    currentUserId = currentUser.userid || null;
  }
} catch (e) {
  console.warn("No user info found:", e);
}

const adminButton = document.getElementById("admin-button");

function updateAdminButton() {
  if (AdminIndicator === 1) {
    adminButton.style.display = "inline-block";

    adminButton.addEventListener("click", () => {
      // Direct navigation instead of fetch + injection
      window.location.href = "../editbook/editbook.html";
    });

  } else {
    adminButton.style.display = "none";
    adminButton.disabled = true;
  }
}

updateAdminButton();


document.getElementById("back-to-dashboard").addEventListener("click", () => {
  window.parent.postMessage({ action: "close-bookdetails" }, "*");
});