document.addEventListener("DOMContentLoaded", () => {

  // Insert book
  async function insertBook(bookData) {
    const payload = {
      Name: bookData.title,
      AuthorName: bookData.author,
      PublisherName: bookData.publisher,
      category: bookData.category,
      genre: bookData.genre,
      publishdate: bookData.publishDate,
      language: bookData.language,
      pagecount: bookData.pages,
      copiesavailable: bookData.copies,
      ratedType: "General",
      imglink: bookData.imgLink,
      description: bookData.description
    };

    const res = await fetch("https://library-backend-excpspbhaq-uc.a.run.app/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("STATUS:", res.status, "OK?", res.ok);

    // Capture raw text so errors are visible
    const raw = await res.text();
    console.log("RAW RESPONSE:", raw);

    try {
      return JSON.parse(raw);
    } catch {
      return { success: false, message: "Invalid JSON", raw };
    }
  }

  const imgLinkInput = document.getElementById("imgLink");
  if (imgLinkInput) {
    imgLinkInput.addEventListener("input", (e) => {
      const link = e.target.value.trim();
      const img = document.getElementById("bookCover");
      img.src = link || "";
      img.alt = link ? "Book Cover" : "No Image";
    });
  }

  const cancelBtnMain = document.getElementById("cancelBtn");
  if (cancelBtnMain) {
    cancelBtnMain.addEventListener("click", () => {
      window.parent.postMessage({ action: "cancel-btn" }, "*");
    });
  }

  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
  const bookData = {
    title: document.getElementById("name")?.value.trim() || "",
    author: document.getElementById("author")?.value.trim() || "",
    publisher: document.getElementById("publisher")?.value.trim() || "",
    category: document.getElementById("category")?.value.trim() || "",
    genre: document.getElementById("genre")?.value.trim() || "",
    publishDate: document.getElementById("publishDate")?.value.trim() || "",
    language: document.getElementById("language")?.value.trim() || "",
    pages: parseInt(document.getElementById("pages")?.value, 10) || 0,
    copies: parseInt(document.getElementById("copies")?.value, 10) || 0,
    description: document.getElementById("description")?.value.trim() || "",
    imgLink: document.getElementById("imgLink")?.value.trim() || ""
  };

  const allFilled = (
    bookData.title &&
    bookData.author &&
    bookData.publisher &&
    bookData.category &&
    bookData.genre &&
    bookData.publishDate &&
    bookData.language &&
    bookData.description &&
    bookData.imgLink &&
    bookData.pages > 0 &&
    bookData.copies > 0
  );

  if (!allFilled) {
    window.parent.postMessage({ action: "upload-error", message: "Please fill all fields." }, "*");
    return;
  }

  const result = await insertBook(bookData);
  console.log("FINAL RESULT:", result);

  if (result && result.success) {
    window.parent.postMessage({ action: "save-btn", data: result }, "*");
  } else {
    const msg = result && result.message ? result.message : "Upload failed. Please try again.";
    window.parent.postMessage({ action: "upload-error", message: msg }, "*");
  }
});
  }

  const saveBtn = document.getElementById("saveBookBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const data = {
        id: document.getElementById("bookId")?.value || "",
        title: document.getElementById("bookTitle")?.value || "",
        author: document.getElementById("bookAuthor")?.value || ""
      };
      window.parent.postMessage({ action: "save-btn", data }, "*");
    });
  }

  const cancelBtn = document.getElementById("cancelBookBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.parent.postMessage({ action: "cancel-btn" }, "*");
    });
  }

});