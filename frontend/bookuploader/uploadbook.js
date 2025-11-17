document.addEventListener("DOMContentLoaded", () => {

  // Insert book (API automatically creates author/publisher if they do not exist)
  async function insertBook(bookData) {
    const payload = {
      Name: bookData.title,
      authorName: bookData.author,
      publisherName: bookData.publisher,
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

    const res = await fetch("http://localhost:5000/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("STATUS:", res.status, "OK?", res.ok);

    // Capture raw text so errors are visible
    const raw = await res.text();
    console.log("RAW RESPONSE:", raw);

    // Attempt to parse JSON only if possible
    try {
      return JSON.parse(raw);
    } catch {
      return { success: false, message: "Invalid JSON", raw };
    }
  }

  // Update image preview
  const imgLinkInput = document.getElementById("imgLink");
  if (imgLinkInput) {
    imgLinkInput.addEventListener("input", (e) => {
      const link = e.target.value.trim();
      const img = document.getElementById("bookCover");
      img.src = link || "";
      img.alt = link ? "Book Cover" : "No Image";
    });
  }

  // Cancel button
  const cancelBtnMain = document.getElementById("cancelBtn");
  if (cancelBtnMain) {
    cancelBtnMain.addEventListener("click", () => {
      window.parent.postMessage({ action: "cancel-btn" }, "*");
    });
  }

  // Save / Upload button
  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", async () => {
  const bookData = {
    title: document.getElementById("name")?.value || "",
    author: document.getElementById("author")?.value || "",
    publisher: document.getElementById("publisher")?.value || "",
    category: document.getElementById("category")?.value || "",
    genre: document.getElementById("genre")?.value || "",
    publishDate: document.getElementById("publishDate")?.value || "",
    language: document.getElementById("language")?.value || "",
    pages: parseInt(document.getElementById("pages")?.value, 10) || 0,
    copies: parseInt(document.getElementById("copies")?.value, 10) || 0,
    description: document.getElementById("description")?.value || "",
    imgLink: document.getElementById("imgLink")?.value || ""
  };

  const result = await insertBook(bookData);
  console.log("FINAL RESULT:", result);

  window.parent.postMessage({ action: "save-btn", data: result }, "*");
});
  }

  // Optional extra buttons
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

}); // END DOMContentLoaded
