const API_BASE = "https://library-backend-excpspbhaq-uc.a.run.app";

// GLOBAL FLAGS
let isProcessing = false;  // Flag to prevent multiple rapid clicks
let bookingListenerAttached = false;  // Track if booking event listener is attached
let wishlistListenerAttached = false;  // Track if wishlist event listener is attached

// Utilities
function formatPublishDate(raw) {
  if (!raw) return "";

  try {
    const d = new Date(raw);
    const day = d.getUTCDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    try {
      return raw.split(" ").slice(1, 4).join(" ");
    } catch (err) {
      return raw;
    }
  }
}

function setInitialUserRating(rating) {
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
      star.textContent = '★';
    } else {
      star.classList.remove('active');
      star.textContent = '☆';
    }
  });
}


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
  let data;
  try {
    data = await res.json();
  } catch (e) {
    if (!res.ok) throw new Error("Request failed and response is not JSON");
    data = {};
  }
  if (!res.ok) throw new Error((data && data.message) || "Request failed");
  return data;
}

// Loader + image preload helpers
function getLoadingOverlay() {
  const ov = document.getElementById("loading-overlay");
  return ov || null;
}

function showLoadingOverlay() {
  const ov = getLoadingOverlay();
  if (!ov) return;
  ov.style.display = "flex";
}

function hideLoadingOverlay() {
  const ov = getLoadingOverlay();
  if (!ov) return;
  ov.style.display = "none";
}

function setCoverImageSafely(imgElement, url, placeholder = "../placeholder.png") {
  if (!imgElement) return;
  try {
    imgElement.src = placeholder;
  } catch (e) { /* ignore */ }

  if (!url) return;

  const pre = new Image();
  pre.onload = () => {
    try {
      imgElement.src = url;
    } catch (e) { /* ignore */ }
  };
  pre.onerror = () => {
    try {
      imgElement.src = placeholder;
    } catch (e) { /* ignore */ }
  };
  pre.src = url;
}

// State
let Book = {};
let Author = {};
let Publisher = {};
let userData = { booked: 0, pendingreturn: 0, personalRating: 0, wishlisted: 0 };
let previousBookingState = { booked: 0, pendingreturn: 0 };  // Track previous state for return detection

// Main data loader (revised)
async function loadRealBookData() {
  showLoadingOverlay();

  try {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");
    if (!bookId) {
      console.error("Missing book ID");
      return;
    }

    const imgEl = document.getElementById("book-img");
    if (imgEl) imgEl.src = "../placeholder.png";

    const booksRes = await fetchJson(`${API_BASE}/api/books`);

    if (!booksRes.success || !booksRes.books) {
      console.error("Books list empty");
      return;
    }

    const b = booksRes.books.find((x) => String(x.bookid) === String(bookId));

    if (!b) {
      console.error("Book not found in all-books list");
      return;
    }

    Book = {
      BookId: b.bookid,
      Name: b.name,
      AuthorID: b.authorid,
      Category: b.category,
      Genre: b.genre,
      PublisherID: b.publisherid,
      PublishDate: b.publishdate,
      Language: b.language,
      PageCount: b.pagecount,
      CopiesAvailable: b.copiesavailable,
      ImgLink: b.imglink || "../placeholder.png",
      RatedType: b.ratedtype,
      Description: b.description || "",
      Rating: 0,
      UsersRated: 0,
    };
 
    const fullBookRes = await fetchJson(`${API_BASE}/api/books?book_id=${bookId}`);

    if (fullBookRes.success && fullBookRes.book) {
      const full = fullBookRes.book;

      if (full.authorid) {
        try {
          const aRes = await fetchJson(`${API_BASE}/api/authors?author_id=${full.authorid}`);
          if (aRes.success && aRes.author) {
            Author = {
              AuthorId: aRes.author.authorid,
              AuthorName: aRes.author.authorname || "Unknown",
              AuthorBio: aRes.author.authorbio || ""
            };
          }
        } catch (e) {
          // ignore author errors, show Unknown later
        }
      }
         
      if (full.publisherid) {
        try {
          const pRes = await fetchJson(`${API_BASE}/api/publishers?publisher_id=${full.publisherid}`);
          if (pRes.success && pRes.publisher) {
            Publisher = {
              PublisherId: pRes.publisher.publisherid,
              PublisherName: pRes.publisher.publishername || "Unknown"
            };
          }
        } catch (e) {
          // ignore publisher errors
        }
      }
    }

    try {
      const ratingRes = await fetchJson(`${API_BASE}/api/reviews/rating/${bookId}`);
      Book.Rating = ratingRes.average_rating ? Number(ratingRes.average_rating) : 0;
      Book.UsersRated = ratingRes.review_count || 0;
    } catch (e) {
      Book.Rating = 0;
      Book.UsersRated = 0;
    }

  const currentUser = JSON.parse(
  sessionStorage.getItem("selectedUser") ||
  localStorage.getItem("selectedUser") ||
  "null"
);

if (currentUser) {
  const userId = currentUser.userid;
  
  try {
    const res = await fetch(`${API_BASE}/api/reviews?book_id=${bookId}&user_id=${userId}`);

    if (res.status === 404) {
      console.warn("NO USER RATING (404), SET 0");
      userData.personalRating = 0;

    } else if (res.ok) {
      const data = await res.json();
      console.log("REVIEWS API RAW RESPONSE:", data);

      if (data?.success && data.review && typeof data.review.rating === "number") {
        console.log("USER RATING FOUND:", data.review.rating);
        userData.personalRating = Number(data.review.rating);
      } else {
        console.warn("NO USER RATING, SETTING TO 0");
        userData.personalRating = 0;
      }

    } else {
      userData.personalRating = 0;
    }

  } catch (err) {
    console.warn("ERROR GETTING PERSONAL RATING:", err);
    userData.personalRating = 0;
  }

  try {
    const bookingRes = await fetchJson(`${API_BASE}/api/bookings?user_id=${userId}&book_id=${bookId}`);
    
    console.log("RAW BOOKING RESPONSE:", bookingRes);
    console.log("Looking for bookId:", bookId, "userId:", userId);
    
    if (bookingRes.success && bookingRes.bookings && bookingRes.bookings.length > 0) {
      // Filter to find booking for THIS SPECIFIC BOOK (in case API returns all bookings)
      const booking = bookingRes.bookings.find(b => String(b.bookid) === String(bookId));
      
      if (booking) {
        console.log("BOOKING FOUND FOR THIS BOOK:", booking);
        
        const isCurrentlyBooked = booking.currentlybookedindicator || false;
        const isPendingReturn = booking.pendingreturnindicator || false;
        
        userData.booked = isCurrentlyBooked ? 1 : 0;
        userData.pendingreturn = isPendingReturn ? 1 : 0;
        userData.bookingId = booking.bookingid;
        
        // DETECT IF BOOK WAS RETURNED BY ADMIN
        // If previously booked/pending, but now not booked and not pending = admin approved return
        if ((previousBookingState.booked === 1 || previousBookingState.pendingreturn === 1) &&
            userData.booked === 0 && userData.pendingreturn === 0) {
          console.log("BOOK WAS RETURNED BY ADMIN - Backend already incremented copies, displaying fresh data");
        }
        
        console.log("BOOKING STATUS PARSED - booked:", userData.booked, "pendingreturn:", userData.pendingreturn, "bookingId:", userData.bookingId);
      } else {
        console.log("NO BOOKING FOUND FOR THIS SPECIFIC BOOK (bookid:" + bookId + ")");
        // If previously had a booking but now no booking found = return completed
        if (previousBookingState.booked === 1 || previousBookingState.pendingreturn === 1) {
          console.log("BOOKING RECORD DELETED - Return was approved by admin. Showing updated copies from DB");
        }
        userData.booked = 0;
        userData.pendingreturn = 0;
      }
    } else {
      console.log("NO ACTIVE BOOKINGS FOUND AT ALL");
      userData.booked = 0;
      userData.pendingreturn = 0;
    }
  } catch (err) {
    console.warn("ERROR FETCHING BOOKING STATUS:", err);
    userData.booked = 0;
    userData.pendingreturn = 0;
  }
  
  previousBookingState = { booked: userData.booked, pendingreturn: userData.pendingreturn };

  // FETCH WISHLIST STATUS FOR THIS BOOK
  try {
    const wishRes = await fetchJson(`${API_BASE}/api/reservations?user_id=${userId}&book_id=${bookId}`);
    
    console.log("RAW WISHLIST RESPONSE:", wishRes);
    
    if (wishRes.success && wishRes.reservations && wishRes.reservations.length > 0) {
      const reservation = wishRes.reservations[0];
      console.log("FIRST RESERVATION RECORD:", reservation);
      userData.wishlisted = 1;
      userData.reservationId = reservation.reservationid || reservation.ReservationId || reservation.reservation_id;
      console.log("WISHLIST STATUS FETCHED: wishlisted, reservationId:", userData.reservationId);
    } else {
      console.log("NO WISHLIST FOUND FOR THIS BOOK");
      userData.wishlisted = 0;
    }
  } catch (err) {
    console.warn("ERROR FETCHING WISHLIST STATUS:", err);
    userData.wishlisted = 0;
  }
}

    initDOM();
    
    if (userData.pendingreturn === 1) {
      startAutoReload();
    } else {
      stopAutoReload();
    }
  } catch (err) {
    console.error("Failed to load book:", err);
  } finally {
    hideLoadingOverlay();
  }

}

// UI initialization
function initDOM() {
  function populateDetails() {
    const imgEl = document.getElementById("book-img");
    setCoverImageSafely(imgEl, Book.ImgLink, "../placeholder.png");


    document.getElementById("book-name").textContent = Book.Name || "";
    document.getElementById("book-author").textContent =
      (Author && Author.AuthorName) || "Unknown";
    document.getElementById("book-category").textContent = Book.Category || "";
    document.getElementById("book-genre").textContent = Book.Genre || "";
    document.getElementById("book-publisher").textContent =
      (Publisher && Publisher.PublisherName) || "Unknown";
    document.getElementById("book-publishdate").textContent =
      formatPublishDate(Book.PublishDate);
    document.getElementById("book-language").textContent = Book.Language || "";
    document.getElementById("book-pagecount").textContent = Book.PageCount ?? "";
    document.getElementById("book-copies").textContent =
      Book.CopiesAvailable ?? "";
    document.getElementById("book-rating").textContent = `${(Book.Rating || 0).toFixed(1)}/5`;
    document.getElementById("book-usersrated").textContent = `${Book.UsersRated || 0} users`;
    document.getElementById("book-rated").textContent = Book.RatedType || "";

  }  

  populateDetails();

  const bookButton = document.getElementById("book-button");
  const wishlistButton = document.getElementById("wishlist-button");

  function updateButtonState() {
    if (!bookButton) return;
    bookButton.classList.remove("green", "grey", "orange", "darkgreen");
    bookButton.disabled = false;

    if (userData.pendingreturn === 1) {
      bookButton.textContent = "Pending Return";
      bookButton.classList.add("orange");
      bookButton.disabled = true;
      return;
    }

    if ((Book.CopiesAvailable ?? 0) <= 0 && userData.booked === 0) {
      bookButton.textContent = "Book";
      bookButton.classList.add("darkgreen");
      bookButton.disabled = true;
      return;
    }

    if (userData.booked === 0) {
      bookButton.textContent = "Book";
      bookButton.classList.add("green");
    } else if (userData.booked === 1) {
      bookButton.textContent = "Return";
      bookButton.classList.add("grey");
    }
  }

  updateButtonState();

  function updateWishlistUI() {
    if (!wishlistButton) return;
    
    if (userData.booked === 1) {
      wishlistButton.disabled = true;
      wishlistButton.title = "Cannot wishlist a booked book. Return the book first.";
    } else {
      wishlistButton.disabled = false;
      wishlistButton.title = userData.wishlisted ? "Remove from wishlist" : "Add to wishlist";
    }
    
    if (userData.wishlisted) wishlistButton.classList.add("active");
    else wishlistButton.classList.remove("active");
  }

  updateWishlistUI();

  attachBookingListener();
  attachWishlistListener();

// BOOKING LOGIC
function attachBookingListener() {
  if (bookingListenerAttached) return;  // Don't attach twice
  
  const bookButton = document.getElementById("book-button");
  
  if (!bookButton) return;
  
  bookButton.addEventListener("click", () => {
    if (isProcessing) {
      console.warn("Request already in progress");
      return;
    }
    
    const isBooking =
      userData.booked === 0 &&
      userData.pendingreturn === 0 &&
      (Book.CopiesAvailable ?? 0) > 0;

    const isReturnRequest =
      userData.booked === 1 && userData.pendingreturn === 0;

    if (isBooking) {
      isProcessing = true;
      bookButton.disabled = true;
      
      (async () => {
        try {
          const currentUser = JSON.parse(
            sessionStorage.getItem("selectedUser") ||
              localStorage.getItem("selectedUser") ||
              "null"
          );
          if (!currentUser) {
            showToast("Error", "Please sign in");
            return;
          }

          const userId = currentUser.userid;
          const bookId = Book.BookId;

          const due = new Date();
          due.setDate(due.getDate() + 14);
          const dueDate = due.toISOString().replace("T", " ").split(".")[0];

          const bookingRes = await fetchJson(
            `${API_BASE}/api/bookings`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ UserId: userId, BookId: bookId, dueDate }),
            }
          );

          userData.booked = 1;
          userData.pendingreturn = 0;
          userData.bookingId = bookingRes.booking_id;
          Book.CopiesAvailable = (Book.CopiesAvailable ?? 1) - 1;

          try {
            const updateRes = await fetchJson(`${API_BASE}/api/books/${bookId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ copiesavailable: Book.CopiesAvailable })
            });
            console.log("Book copies updated in DB - Response:", updateRes);
            
            await loadRealBookData();
          } catch (copyUpdateErr) {
            console.error("Failed to update book copies in DB:", copyUpdateErr);
            await loadRealBookData();
          }
          
          showToast("Booked", "Successfully booked");
          
          localStorage.setItem('booking-status-changed', Date.now().toString());
          window.parent.postMessage({ action: "booking-changed" }, "*");
        } catch (e) {
          showToast("Error", "Booking failed");
        } finally {
          isProcessing = false;
          bookButton.disabled = false;
        }
      })();
      return;
    }

    if (isReturnRequest) {
      isProcessing = true;
      bookButton.disabled = true;
      
      (async () => {
        try {
          await fetchJson(
            `${API_BASE}/api/bookings/${userData.bookingId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                CurrentlyBookedIndicator: false,
                pendingReturnIndicator: true,
              }),
            }
          );

          userData.pendingreturn = 1;
          updateButtonState();
          updateWishlistUI();
          showToast("Return Request", "Sent to admin");
          
          localStorage.setItem('booking-status-changed', Date.now().toString());
          window.parent.postMessage({ action: "booking-changed" }, "*");
        } catch (e) {
          showToast("Error", "Return failed");
        } finally {
          isProcessing = false;
          bookButton.disabled = false;
        }
      })();
    }
  });
  
  bookingListenerAttached = true;
}

function attachWishlistListener() {
  if (wishlistListenerAttached) return;
  
  const wishlistButton = document.getElementById("wishlist-button");
  
  if (!wishlistButton) return;
  
  wishlistButton.addEventListener("click", () => {
    if (userData.booked === 1) {
      showToast("Cannot Wishlist", "Return the book first to add to wishlist");
      return;
    }
    
    userData.wishlisted = userData.wishlisted ? 0 : 1;
    updateWishlistUI();

    (async () => {
      try {
        const currentUser = JSON.parse(
          sessionStorage.getItem("selectedUser") ||
            localStorage.getItem("selectedUser") ||
            "null"
        );
        if (!currentUser) return showToast("Error", "Sign in first");

        const userId = currentUser.userid;
        const bookId = Book.BookId;

        if (userData.wishlisted) {
          const data = await fetchJson(`${API_BASE}/api/reservations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ UserId: userId, BookId: bookId }),
          });

          userData.reservationId = data.reservation_id;
          showToast("Wishlisted", "Book added");
        } else {
          if (userData.reservationId) {
            await fetchJson(
              `${API_BASE}/api/reservations/${userData.reservationId}`,
              { method: "DELETE" }
            );
          }
          showToast("Removed", "Book removed");
        }
      } catch (e) {
        showToast("Error", "Wishlist failed");
      }
    })();
  });
  
  wishlistListenerAttached = true;
}

// STAR RATING
const stars = document.querySelectorAll(".star");
let persistentRating = userData.personalRating || 0;

function updateStars() {
  stars.forEach((star) => {
    const v = parseInt(star.dataset.value, 10);
    star.textContent = v <= persistentRating ? "★" : "☆";
    star.classList.toggle("filled", v <= persistentRating);
  });
}

updateStars();

stars.forEach((star) => {
  const val = parseInt(star.dataset.value, 10);

  star.addEventListener("mouseover", () => {
    stars.forEach((s) => {
      const v = parseInt(s.dataset.value, 10);
      s.textContent = v <= val ? "★" : "☆";
      s.classList.toggle("filled", v <= val);
    });
  });

  star.addEventListener("mouseout", updateStars);

  star.addEventListener("click", async () => {
    const currentUser = JSON.parse(
      sessionStorage.getItem("selectedUser") ||
      localStorage.getItem("selectedUser") ||
      "null"
    );
    if (!currentUser) return showToast("Error", "Please sign in");

    const userId = currentUser.userid;
    const bookId = Book.BookId;
    const newRating = val;

    try {
      await fetchJson(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          BookID: bookId,
          UserId: userId,
          Rating: newRating
        })
      });

      userData.personalRating = newRating;
      persistentRating = newRating;

      updateStars();
      showToast("Rating Saved", `You rated ${newRating} stars`);

    } catch (err) {
      showToast("Error", "Rating failed");
      console.error(err);
    }
  });
});

  // DESCRIPTION TOGGLE
  const descText = document.getElementById("description-text");
  const toggleBtn = document.getElementById("toggle-description");

  let expanded = false;
  const safeDesc = Book.Description || "";
  const shortText =
    safeDesc.split(" ").slice(0, 60).join(" ") + (safeDesc.length > 60 ? "..." : "");
  if (descText) descText.textContent = shortText;

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      expanded = !expanded;
      if (descText) descText.textContent = expanded ? safeDesc : shortText;
      toggleBtn.textContent = expanded ? "Show less" : "Show more";
    });
  }

  // BACK BUTTON
  const backBtn = document.getElementById("back-to-dashboard");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.parent.postMessage({ action: "close-bookdetails" }, "*");
    });
  }

  // ADMIN BUTTON
  const currentUserLocal = JSON.parse(localStorage.getItem("selectedUser") || "null");
  const AdminIndicator = currentUserLocal?.adminindicator ? 1 : 0;
  const adminButton = document.getElementById("admin-button");

  if (adminButton) {
    if (AdminIndicator === 1) {
      adminButton.style.display = "inline-block";
      adminButton.addEventListener("click", () => {
        const payload = { Book, Author, Publisher };
        sessionStorage.setItem("editBookPayload", JSON.stringify(payload));
        window.location.href = `../editbook/editbook.html?id=${Book.BookId}`;
      });
    } else {
      adminButton.style.display = "none";
    }
  }

  setTimeout(() => {
    const stars = document.querySelectorAll(".star");
    const rating = userData.personalRating || 0;

    stars.forEach((star) => {
      const v = parseInt(star.dataset.value, 10);
      star.textContent = v <= rating ? "★" : "☆";
      star.classList.toggle("filled", v <= rating);
    });
  }, 50);
}

window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'reload-book-data') {
    console.log("RECEIVED RELOAD MESSAGE - Reloading book data...");
    // Reload the book data when coming back from settings
    stopAutoReload();
    loadRealBookData();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'booking-status-changed') {
    console.log("BOOKING STATUS CHANGED IN ANOTHER TAB - Reloading book data...");
    loadRealBookData();
  }
});

let autoReloadInterval = null;

function startAutoReload() {
  if (autoReloadInterval) return; // Already running
  
  autoReloadInterval = setInterval(() => {
    if (userData.pendingreturn === 1) {
      console.log("Auto-checking for admin approval of return...");
      loadRealBookData();
    }
  }, 30000);
  
  console.log("Auto-reload started for pending returns");
}

function stopAutoReload() {
  if (autoReloadInterval) {
    clearInterval(autoReloadInterval);
    autoReloadInterval = null;
    console.log("Auto-reload stopped");
  }
}

// Start loading
loadRealBookData();