// Update image preview
document.getElementById("imgLink").addEventListener("input", (e) => {
  const link = e.target.value.trim();
  const img = document.getElementById("bookCover");
  img.src = link || "";
  img.alt = link ? "Book Cover" : "No Image";
});

// Cancel button: notify parent to hide overlay
document.getElementById("cancelBtn").addEventListener("click", () => {
  window.parent.postMessage({ action: 'cancel-btn' }, '*');
});

// Upload / Save button: collect form data and send to parent
document.getElementById("uploadBtn").addEventListener("click", () => {
  const bookData = {
    id: document.getElementById('bookId')?.value || '',
    title: document.getElementById('bookTitle')?.value || '',
    author: document.getElementById('bookAuthor')?.value || '',
    publisher: document.getElementById('publisher')?.value || '',
    category: document.getElementById('category')?.value || '',
    genre: document.getElementById('genre')?.value || '',
    publishDate: document.getElementById('publishDate')?.value || '',
    language: document.getElementById('language')?.value || '',
    pages: parseInt(document.getElementById('pages')?.value, 10) || 0,
    copies: parseInt(document.getElementById('copies')?.value, 10) || 0,
    description: document.getElementById('description')?.value || '',
    imgLink: document.getElementById('imgLink')?.value || ''
  };

  console.log("Book object:", bookData);

  // Send book data to parent window
  window.parent.postMessage({ action: 'save-btn', data: bookData }, '*');
});

// Optional extra buttons if you also have 'saveBookBtn' and 'cancelBookBtn'
const saveBtn = document.getElementById('saveBookBtn');
const cancelBtn = document.getElementById('cancelBookBtn');

if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    const bookData = {
      id: document.getElementById('bookId')?.value || '',
      title: document.getElementById('bookTitle')?.value || '',
      author: document.getElementById('bookAuthor')?.value || ''
    };
    window.parent.postMessage({ action: 'save-btn', data: bookData }, '*');
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    window.parent.postMessage({ action: 'cancel-btn' }, '*');
  });
}
