const API_BASE = "https://library-backend-excpspbhaq-uc.a.run.app";

function formatPublishDate(raw) {
  if (!raw) return "";

  try {
    const d = new Date(raw);
    const day = d.getUTCDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getUTCFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return raw.split(" ").slice(1, 4).join(" ");  // fallback
  }
}

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
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ====================================================================
//   REAL DATA
// ====================================================================
let Book = {};
let Author = {};
let Publisher = {};
let userData = { booked: 0, pendingreturn: 0, personalRating: 0, wishlisted: 0 };

// ====================================================================
//   LOAD REAL BOOK DATA
// ====================================================================
async function loadRealBookData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");
    if (!bookId) return console.error("Missing book ID");

    // ----------------------------
    // 1) FETCH ALL BOOKS
    // ----------------------------
    const booksRes = await fetchJson(`${API_BASE}/api/books`);

    if (!booksRes.success || !booksRes.books) {
      console.error("Books list empty");
      return;
    }

    // ----------------------------
    // 2) FIND BOOK RECORD
    // ----------------------------
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

    // ----------------------------
    // FIX: FETCH FULL BOOK DETAILS (author + publisher)
    // ----------------------------
// FETCH FULL BOOK DETAILS
const fullBookRes = await fetchJson(
  `${API_BASE}/api/books?book_id=${bookId}`
);

if (fullBookRes.success && fullBookRes.book) {
  const full = fullBookRes.book;

  // Author (backend returns: { author: {...} })
if (full.authorid) {
  const aRes = await fetchJson(
    `${API_BASE}/api/authors?author_id=${full.authorid}`
  );

  if (aRes.success && aRes.author) {
    Author = {
      AuthorId: aRes.author.authorid,
      AuthorName: aRes.author.authorname || "Unknown",
      AuthorBio: aRes.author.authorbio || ""
    };
  }
}

// Publisher (backend returns: { publisher: {...} })
if (full.publisherid) {
  const pRes = await fetchJson(
    `${API_BASE}/api/publishers?publisher_id=${full.publisherid}`
  );

  if (pRes.success && pRes.publisher) {
    Publisher = {
      PublisherId: pRes.publisher.publisherid,
      PublisherName: pRes.publisher.publishername || "Unknown"
    };
  }
}

}


    // ----------------------------
    // 5) INITIALIZE UI
    // ----------------------------
    initDOM();
  } catch (err) {
    console.error("Failed to load book:", err);
  }
}

// ====================================================================
//   INITIALIZE ALL DOM LOGIC AFTER DATA IS LOADED
// ====================================================================
function initDOM() {
  // ----------------- POPULATE DETAILS -----------------
  function populateDetails() {
    document.getElementById("book-img").src = Book.ImgLink;
    document.getElementById("book-name").textContent = Book.Name;
    document.getElementById("book-author").textContent =
      Author.AuthorName || "Unknown";
    document.getElementById("book-category").textContent = Book.Category;
    document.getElementById("book-genre").textContent = Book.Genre;
    document.getElementById("book-publisher").textContent =
      Publisher.PublisherName || "Unknown";
    document.getElementById("book-publishdate").textContent =
      formatPublishDate(Book.PublishDate);
    document.getElementById("book-language").textContent = Book.Language;
    document.getElementById("book-pagecount").textContent = Book.PageCount;
    document.getElementById("book-copies").textContent =
      Book.CopiesAvailable;
    document.getElementById("book-rating").textContent = `${Book.Rating.toFixed(
      1
    )}/5`;
    document.getElementById("book-usersrated").textContent = `${Book.UsersRated} users`;
    document.getElementById("book-rated").textContent = Book.RatedType;
  }

  populateDetails();

  // ====================================================================
  // BUTTONS & STATES
  // ====================================================================
  const bookButton = document.getElementById("book-button");
  const wishlistButton = document.getElementById("wishlist-button");

  function updateButtonState() {
    bookButton.classList.remove("green", "grey", "orange", "darkgreen");
    bookButton.disabled = false;

    if (Book.CopiesAvailable <= 0 && userData.booked === 0) {
      bookButton.textContent = "Book";
      bookButton.classList.add("darkgreen");
      bookButton.disabled = true;
      return;
    }

    if (userData.booked === 0 && userData.pendingreturn === 0) {
      bookButton.textContent = "Book";
      bookButton.classList.add("green");
    } else if (userData.booked === 1 && userData.pendingreturn === 0) {
      bookButton.textContent = "Return";
      bookButton.classList.add("grey");
    } else if (userData.booked === 1 && userData.pendingreturn === 1) {
      bookButton.textContent = "Pending Return";
      bookButton.classList.add("orange");
      bookButton.disabled = true;
    }
  }

  updateButtonState();

  // ====================================================================
  // BOOKING LOGIC
  // ====================================================================
  bookButton.addEventListener("click", () => {
    const isBooking =
      userData.booked === 0 &&
      userData.pendingreturn === 0 &&
      Book.CopiesAvailable > 0;

    const isReturnRequest =
      userData.booked === 1 && userData.pendingreturn === 0;

    // BOOK
    if (isBooking) {
      (async () => {
        try {
          const currentUser = JSON.parse(
            sessionStorage.getItem("selectedUser") ||
              localStorage.getItem("selectedUser") ||
              "null"
          );
          if (!currentUser) return showToast("Error", "Please sign in");

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
          Book.CopiesAvailable -= 1;

          populateDetails();
          updateButtonState();
          showToast("Booked", "Successfully booked");
        } catch (e) {
          showToast("Error", "Booking failed");
        }
      })();
      return;
    }

    // RETURN REQUEST
    if (isReturnRequest) {
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
          showToast("Return Request", "Sent to admin");
        } catch (e) {
          showToast("Error", "Return failed");
        }
      })();
    }
  });

  // ====================================================================
  // WISHLIST LOGIC
  // ====================================================================
  function updateWishlistUI() {
    if (userData.wishlisted)
      wishlistButton.classList.add("active");
    else wishlistButton.classList.remove("active");
  }

  wishlistButton.addEventListener("click", () => {
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

  // ====================================================================
  // STAR RATING
  // ====================================================================
  const stars = document.querySelectorAll(".star");
  let persistentRating = userData.personalRating;

  function updateStars() {
    stars.forEach((star) => {
      const v = parseInt(star.dataset.value);
      star.textContent = v <= persistentRating ? "★" : "☆";
      star.classList.toggle("filled", v <= persistentRating);
    });
  }

  stars.forEach((star) => {
    const val = parseInt(star.dataset.value);

    star.addEventListener("mouseover", () => {
      stars.forEach((s) => {
        const v = parseInt(s.dataset.value);
        s.textContent = v <= val ? "★" : "☆";
        s.classList.toggle("filled", v <= val);
      });
    });

    star.addEventListener("mouseout", updateStars);

    star.addEventListener("click", () => {
      const oldRating = userData.personalRating;
      persistentRating = val;
      userData.personalRating = val;

      if (oldRating === 0) {
        Book.UsersRated += 1;
        Book.Rating =
          (Book.Rating * (Book.UsersRated - 1) + val) /
          Book.UsersRated;
      } else {
        Book.Rating =
          (Book.Rating * Book.UsersRated - oldRating + val) /
          Book.UsersRated;
      }

      document.getElementById("book-rating").textContent = `${Book.Rating.toFixed(
        1
      )}/5`;
      document.getElementById(
        "book-usersrated"
      ).textContent = `${Book.UsersRated} users`;

      updateStars();
      showToast("Rating Saved", `You rated ${val} stars`);
    });
  });

  updateStars();

  // ====================================================================
  // DESCRIPTION TOGGLE
  // ====================================================================
  const descText = document.getElementById("description-text");
  const toggleBtn = document.getElementById("toggle-description");

  let expanded = false;
  const shortText =
    Book.Description.split(" ").slice(0, 60).join(" ") + "...";
  descText.textContent = shortText;

  toggleBtn.addEventListener("click", () => {
    expanded = !expanded;
    descText.textContent = expanded ? Book.Description : shortText;
    toggleBtn.textContent = expanded ? "Show less" : "Show more";
  });

  // ====================================================================
  // BACK BUTTON
  // ====================================================================
  document
    .getElementById("back-to-dashboard")
    .addEventListener("click", () => {
      window.parent.postMessage(
        { action: "close-bookdetails" },
        "*"
      );
    });

  // ====================================================================
  // ADMIN BUTTON
  // ====================================================================
  const currentUser = JSON.parse(
    localStorage.getItem("selectedUser") || "null"
  );
  const AdminIndicator = currentUser?.adminindicator ? 1 : 0;
  const adminButton = document.getElementById("admin-button");

  if (AdminIndicator === 1) {
    adminButton.style.display = "inline-block";
    adminButton.addEventListener("click", () => {
      window.location.href = "../editbook/editbook.html";
    });
  } else {
    adminButton.style.display = "none";
  }
}

// ====================================================================
//   START EVERYTHING
// ====================================================================
loadRealBookData();
