# API Documentation

This document describes all available API endpoints for the Library Management System.

Base URL: `http://localhost:5000`

## Table of Contents
- [Users](#users)
- [Authors](#authors)
- [Publishers](#publishers)
- [Books](#books)
- [Bookings](#bookings)
- [Reservations](#reservations)
- [Reviews](#reviews)
- [Transactions](#transactions)

---

## Users

### GET /api/users
Get all users or a specific user.

**Query Parameters:**
- `user_id` (optional): Get a specific user by UserId

**Example:**
```bash
# Get all users
GET /api/users

# Get specific user
GET /api/users?user_id=USR1234567
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "users": [
    {
      "userid": "USR1234567",
      "username": "john_doe",
      "email": "john@example.com",
      "passwordhash": "...",
      "creationtime": "2024-01-01T00:00:00",
      "adminindicator": false
    }
  ]
}
```

### POST /api/users
Create a new user.

**Request Body:**
```json
{
  "UserId": "USR1234567",
  "Username": "john_doe",
  "Email": "john@example.com",
  "PasswordHash": "hashed_password_here",
  "AdminIndicator": false,
  "CreationTime": "2024-01-01T00:00:00"
}
```

**Required Fields:** UserId, Username, Email, PasswordHash

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user_id": "USR1234567"
}
```

### PUT /api/users/<user_id>
Update an existing user.

**Request Body:**
```json
{
  "Username": "new_username",
  "Email": "newemail@example.com",
  "PasswordHash": "new_hash",
  "AdminIndicator": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user_id": "USR1234567"
}
```

---

## Authors

### GET /api/authors
Get all authors or a specific author.

**Query Parameters:**
- `author_id` (optional): Get a specific author by AuthorId

**Example:**
```bash
GET /api/authors
GET /api/authors?author_id=1
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "authors": [
    {
      "authorid": 1,
      "authorname": "J.K. Rowling",
      "authorbio": "British author..."
    }
  ]
}
```

### POST /api/authors
Create a new author.

**Request Body:**
```json
{
  "AuthorName": "J.K. Rowling",
  "AuthorBio": "British author, best known for the Harry Potter series"
}
```

**Required Fields:** AuthorName

**Response:**
```json
{
  "success": true,
  "message": "Author created successfully",
  "author_id": 1
}
```

### PUT /api/authors/<author_id>
Update an existing author.

**Request Body:**
```json
{
  "AuthorName": "Updated Name",
  "AuthorBio": "Updated bio"
}
```

---

## Publishers

### GET /api/publishers
Get all publishers or a specific publisher.

**Query Parameters:**
- `publisher_id` (optional): Get a specific publisher by PublisherId

**Example:**
```bash
GET /api/publishers
GET /api/publishers?publisher_id=1
```

### POST /api/publishers
Create a new publisher.

**Request Body:**
```json
{
  "PublisherName": "Penguin Books"
}
```

**Required Fields:** PublisherName

### PUT /api/publishers/<publisher_id>
Update an existing publisher.

**Request Body:**
```json
{
  "PublisherName": "Updated Publisher Name"
}
```

---

## Books

### GET /api/books
Get all books or a specific book.

**Query Parameters:**
- `book_id` (optional): Get a specific book by BookId

**Example:**
```bash
GET /api/books
GET /api/books?book_id=1
```

### POST /api/books
Create a new book.

**Request Body:**
```json
{
  "Name": "Harry Potter and the Philosopher's Stone",
  "authorID": 1,
  "category": "Fiction",
  "genre": "Fantasy",
  "publisherID": 1,
  "publishdate": "1997-06-26",
  "language": "English",
  "pagecount": 223,
  "copiesavailable": 10,
  "imglink": "https://example.com/image.jpg",
  "ratedType": "PG",
  "description": "A young wizard's journey..."
}
```

**Required Fields:** Name, authorID, category, genre, publishdate, language, pagecount, copiesavailable, ratedType

**Note:** `publishdate` should be in format `YYYY-MM-DD`

### PUT /api/books/<book_id>
Update an existing book.

**Request Body:** (any combination of book fields)
```json
{
  "Name": "Updated Book Name",
  "copiesavailable": 15,
  "description": "Updated description"
}
```

---

## Bookings

### GET /api/bookings
Get all bookings or filter by user/book.

**Query Parameters:**
- `booking_id` (optional): Get a specific booking
- `user_id` (optional): Get all bookings for a user
- `book_id` (optional): Get all bookings for a book

**Example:**
```bash
GET /api/bookings
GET /api/bookings?user_id=USR1234567
GET /api/bookings?book_id=1
```

### POST /api/bookings
Create a new booking.

**Request Body:**
```json
{
  "UserId": "USR1234567",
  "BookId": 1,
  "BookingDate": "2024-01-01 10:00:00",
  "dueDate": "2024-01-15 10:00:00",
  "CurrentlyBookedIndicator": true,
  "pendingReturnIndicator": false
}
```

**Required Fields:** UserId, BookId, dueDate

**Note:** Dates should be in format `YYYY-MM-DD HH:MM:SS`

### PUT /api/bookings/<booking_id>
Update an existing booking.

**Request Body:**
```json
{
  "CurrentlyBookedIndicator": false,
  "pendingReturnIndicator": true,
  "dueDate": "2024-01-20 10:00:00"
}
```

---

## Reservations

### GET /api/reservations
Get all reservations or filter by user/book.

**Query Parameters:**
- `reservation_id` (optional): Get a specific reservation
- `user_id` (optional): Get all reservations for a user
- `book_id` (optional): Get all reservations for a book

**Example:**
```bash
GET /api/reservations
GET /api/reservations?user_id=USR1234567
```

### POST /api/reservations
Create a new reservation.

**Request Body:**
```json
{
  "UserId": "USR1234567",
  "BookId": 1,
  "ReservationDate": "2024-01-01 10:00:00"
}
```

**Required Fields:** UserId, BookId

### PUT /api/reservations/<reservation_id>
Update an existing reservation.

**Request Body:**
```json
{
  "UserId": "USR1234567",
  "BookId": 2,
  "ReservationDate": "2024-01-02 10:00:00"
}
```

---

## Reviews

### GET /api/reviews
Get all reviews or filter by book/user.

**Query Parameters:**
- `book_id` (optional): Get all reviews for a book
- `user_id` (optional): Get all reviews by a user
- Both `book_id` and `user_id`: Get a specific review

**Example:**
```bash
GET /api/reviews
GET /api/reviews?book_id=1
GET /api/reviews?book_id=1&user_id=USR1234567
```

### POST /api/reviews
Create or update a review (upsert).

**Request Body:**
```json
{
  "BookID": 1,
  "UserId": "USR1234567",
  "Rating": 5,
  "ReviewDate": "2024-01-01 10:00:00",
  "ReviewDescription": "Great book! Highly recommend."
}
```

**Required Fields:** BookID, UserId, Rating

**Note:** Rating must be an integer between 1 and 5. If a review already exists for this book/user combination, it will be updated.

### PUT /api/reviews
Update an existing review.

**Request Body:**
```json
{
  "BookID": 1,
  "UserId": "USR1234567",
  "Rating": 4,
  "ReviewDescription": "Updated review text"
}
```

**Required Fields:** BookID, UserId (to identify the review)

---

## Transactions

### GET /api/transactions
Get all transactions or filter by user/book.

**Query Parameters:**
- `transaction_id` (optional): Get a specific transaction
- `user_id` (optional): Get all transactions for a user
- `book_id` (optional): Get all transactions for a book

**Example:**
```bash
GET /api/transactions
GET /api/transactions?user_id=USR1234567
```

### POST /api/transactions
Create a new transaction.

**Request Body:**
```json
{
  "UserId": "USR1234567",
  "BookId": 1,
  "TransactionDate": "2024-01-01 10:00:00",
  "ReservedIndicator": true
}
```

**Required Fields:** UserId, BookId, ReservedIndicator

### PUT /api/transactions/<transaction_id>
Update an existing transaction.

**Request Body:**
```json
{
  "ReservedIndicator": false,
  "TransactionDate": "2024-01-02 10:00:00"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Testing with cURL

### Example: Create an Author
```bash
curl -X POST http://localhost:5000/api/authors \
  -H "Content-Type: application/json" \
  -d '{
    "AuthorName": "J.K. Rowling",
    "AuthorBio": "British author"
  }'
```

### Example: Get All Books
```bash
curl http://localhost:5000/api/books
```

### Example: Update a Book
```bash
curl -X PUT http://localhost:5000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "copiesavailable": 20
  }'
```

---

## Notes

1. **Date Formats:**
   - Dates: `YYYY-MM-DD`
   - Timestamps: `YYYY-MM-DD HH:MM:SS`

2. **PostgreSQL Column Names:**
   - PostgreSQL converts unquoted identifiers to lowercase
   - Access returned data using lowercase keys (e.g., `userid`, `bookid`)

3. **Foreign Key Constraints:**
   - Ensure referenced IDs exist before creating records with foreign keys
   - For example, create an Author before creating a Book that references it

4. **Composite Primary Keys:**
   - Reviews table uses composite key (BookID, UserId)
   - Use both fields to identify a specific review

