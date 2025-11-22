let book = {};
let author = {};
let publisher = {};
let originalPublishDate = null;

function loadBookData() {
  const raw = sessionStorage.getItem("editBookPayload");
  if (!raw) return;

  const data = JSON.parse(raw);

  book = data.Book;
  author = data.Author;
  publisher = data.Publisher;

  document.getElementById("name").value = book.Name;
  document.getElementById("author").value = author.AuthorName;
  document.getElementById("publisher").value = publisher.PublisherName;
  document.getElementById("category").value = book.Category;
  document.getElementById("genre").value = book.Genre;
  document.getElementById("publishDate").value = book.PublishDate;
  document.getElementById("language").value = book.Language;
  document.getElementById("pages").value = book.PageCount;
  document.getElementById("copies").value = book.CopiesAvailable;
  document.getElementById("description").value = book.Description;
  document.getElementById("bookCover").src = book.ImgLink;
  document.getElementById("imglink").value = book.ImgLink;

  originalPublishDate = book.PublishDate;
}

function showAlert(title, message) {
  const alertBox = document.getElementById("alertBox");
  const alertHeader = document.getElementById("alertHeader");
  const alertMessage = document.getElementById("alertMessage");

  alertHeader.textContent = title;
  alertMessage.textContent = message;

  alertBox.classList.remove("hidden");

  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 3000);
}

document.getElementById("imglink").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  book.ImgLink = url;
  document.getElementById("bookCover").src = url;
});


document.getElementById("saveBtn").addEventListener("click", async () => {
  const currentDateInput = document.getElementById("publishDate").value;

const updated = {
  Name: document.getElementById("name").value,
  category: document.getElementById("category").value,
  genre: document.getElementById("genre").value,
  language: document.getElementById("language").value,
  pagecount: parseInt(document.getElementById("pages").value),
  copiesavailable: parseInt(document.getElementById("copies").value),
  description: document.getElementById("description").value,
  imglink: book.ImgLink
};

if (currentDateInput && currentDateInput !== originalPublishDate) {
  updated.publishdate = currentDateInput;
}

  try {
    const res = await fetch(
      `https://library-backend-excpspbhaq-uc.a.run.app/api/books/${book.BookId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      }
    );

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showAlert("Updated", "Book updated successfully!");

    setTimeout(() => {
      window.location.href = "../bookdetails/bookdetails.html?id=" + book.BookId;
    }, 800);

  } catch (err) {
    showAlert("Error", err.message);
  }
});


window.onload = loadBookData;

document.querySelector(".cancel-btn").addEventListener("click", () => {
  window.location.href = "../bookdetails/bookdetails.html";
});
