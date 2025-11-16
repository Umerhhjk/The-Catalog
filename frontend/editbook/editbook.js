// Dummy objects
let author = {
  AuthorId: 1,
  AuthorName: "Max Simon Nordau",
  AuthorBio: "Max Simon Nordau was a critic and social commentator."
};

let publisher = {
  PublisherId: 1,
  PublisherName: "University of Nebraska"
};

let book = {
  BookId: 1,
  Name: "Degeneration",
  authorID: author.AuthorId,
  category: "Literary Criticism",
  genre: "Nonfiction",
  publisherID: publisher.PublisherId,
  publishdate: "1993-11-01",
  language: "English",
  pagecount: 566,
  copiesavailable: 30,
  imglink: "temp.png",
  ratedType: "E for Everyone",
  description: "A powerful critique of cultural decay and moral weakness."
};

// Populate UI fields
function loadBookData() {
  document.getElementById("name").value = book.Name;
  document.getElementById("author").value = author.AuthorName;
  document.getElementById("publisher").value = publisher.PublisherName;
  document.getElementById("category").value = book.category;
  document.getElementById("genre").value = book.genre;
  document.getElementById("publishDate").value = book.publishdate;
  document.getElementById("language").value = book.language;
  document.getElementById("pages").value = book.pagecount;
  document.getElementById("copies").value = book.copiesavailable;
  document.getElementById("description").value = book.description;
  document.getElementById("bookCover").src = book.imglink;
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

document.getElementById("changeBtn").addEventListener("click", () => {
  document.getElementById("imageInput").click();
});

document.getElementById("imageInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById("bookCover").src = event.target.result;
      book.imglink = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById("saveBtn").addEventListener("click", () => {
  // Update object with new values
  book.Name = document.getElementById("name").value;
  author.AuthorName = document.getElementById("author").value;
  publisher.PublisherName = document.getElementById("publisher").value;
  book.category = document.getElementById("category").value;
  book.genre = document.getElementById("genre").value;
  book.publishdate = document.getElementById("publishDate").value;
  book.language = document.getElementById("language").value;
  book.pagecount = parseInt(document.getElementById("pages").value);
  book.copiesavailable = parseInt(document.getElementById("copies").value);
  book.description = document.getElementById("description").value;

  showAlert("Details Saved","Book details saved successfully!");

  setTimeout(() => {
    window.location.href = "../bookdetails/bookdetails.html";
  }, 800);
});

window.onload = loadBookData;

document.querySelector(".cancel-btn").addEventListener("click", () => {
  window.location.href = "../bookdetails/bookdetails.html";
});
