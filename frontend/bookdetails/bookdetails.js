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

// ----------------- Data objects -----------------
const bookData = {
  name: "Degeneration",
  author: "Max Simon Nordau",
  category: "Literary Criticism",
  genre: "Nonfiction",
  publisher: "University of Nebraska",
  publishdate: "1993-11-01",
  language: "English",
  pagecount: 566,
  copiesavailable: 30,
  imglink: "temp.png",
  rating: 4.3,  
  usersRated: 1200,   
  rated: "E for Everyone",
  description: `Max Nordau's *Degeneration* is a landmark study of fin-de-siècle culture. 
  In this provocative work, Nordau critiques modernist art and literature, arguing that the 
  aesthetic trends of the time reflected a cultural and moral decline. He links the 
  decadence of European society with the psychological states of its leading artists. 
  This dummy text continues with additional filler to simulate a long description for testing purposes. 
  It elaborates on ideas of hysteria, neurosis, and artistic excess — the main themes Nordau identified 
  in figures such as Nietzsche and Oscar Wilde.`
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
  if (imgEl) imgEl.src = bookData.imglink;

  document.getElementById("book-name").textContent = bookData.name;
  document.getElementById("book-author").textContent = bookData.author;
  document.getElementById("book-category").textContent = bookData.category;
  document.getElementById("book-genre").textContent = bookData.genre;
  document.getElementById("book-publisher").textContent = bookData.publisher;
  document.getElementById("book-publishdate").textContent = bookData.publishdate;
  document.getElementById("book-language").textContent = bookData.language;
  document.getElementById("book-pagecount").textContent = bookData.pagecount;
  document.getElementById("book-copies").textContent = bookData.copiesavailable;
  document.getElementById("book-rating").textContent = `${bookData.rating.toFixed(1)}/5`;
  document.getElementById("book-usersrated").textContent = `${bookData.usersRated} users`;
  document.getElementById("book-rated").textContent = bookData.rated;
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

  if (bookData.copiesavailable <= 0 && userData.booked === 0) {
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
  if (copiesEl) copiesEl.textContent = bookData.copiesavailable;
}

// ----------------- Booking / Return logic -----------------
if (bookButton) {
  bookButton.addEventListener("click", () => {
    if (userData.booked === 0 && userData.pendingreturn === 0 && bookData.copiesavailable > 0) {
      userData.booked = 1;
      bookData.copiesavailable = Math.max(0, bookData.copiesavailable - 1);

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
let hasRatedBefore = userData.personalRating > 0; // track if user rated before

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
        if (v <= val) {
          s.classList.add('filled');
          s.textContent = '★';
        } else {
          s.classList.remove('filled');
          s.textContent = '☆';
        }
      });
    });

    star.addEventListener('mouseout', () => {
      updateStars();
    });

    star.addEventListener('click', () => {
      const oldRating = userData.personalRating;
      persistentRating = val;
      userData.personalRating = val;

      if (!hasRatedBefore) {
        // First time rating
        bookData.usersRated += 1;
        bookData.rating = ((bookData.rating * (bookData.usersRated - 1)) + val) / bookData.usersRated;
        hasRatedBefore = true;
      } else {
        // Updating existing rating: remove old contribution, add new one
        bookData.rating = ((bookData.rating * bookData.usersRated) - oldRating + val) / bookData.usersRated;
      }

      // Reflect in UI
      document.getElementById("book-rating").textContent = `${bookData.rating.toFixed(1)}/5`;
      document.getElementById("book-usersrated").textContent = `${bookData.usersRated} users`;

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
    bookData.copiesavailable = bookData.copiesavailable + 1;

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

const fullText = bookData.description;
const shortText = fullText.split(" ").slice(0, 60).join(" ") + "...";

let expanded = false;
descText.textContent = shortText;

toggleBtn.addEventListener("click", () => {
  expanded = !expanded;
  descText.textContent = expanded ? fullText : shortText;
  toggleBtn.textContent = expanded ? "Show less" : "Show more";
});