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
  BookId: 101,
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
    if (userData.booked === 0 && userData.pendingreturn === 0 && Book.CopiesAvailable > 0) {
      userData.booked = 1;
      Book.CopiesAvailable = Math.max(0, Book.CopiesAvailable - 1);

      if (userData.wishlisted === 1) {
        userData.wishlisted = 0;
        updateWishlistUI();
      }

      populateDetails();
      updateButtonState();
      showToast("Booking Confirmed", "Book reserved successfully.");
      return;
    }

    if (userData.booked === 1 && userData.pendingreturn === 0) {
      userData.pendingreturn = 1;
      updateButtonState();
      showToast("Return Request", "Return request sent to admin.");
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
    if (userData.wishlisted) {
      showToast("Wishlist Added", "Book added to your wishlist.");
    } else {
      showToast("Wishlist Removed", "Book removed from your wishlist.");
    }
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