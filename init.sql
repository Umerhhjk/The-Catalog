-- init.sql

-- 1) Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserId VARCHAR(10) PRIMARY KEY,
    Username VARCHAR(30) UNIQUE NOT NULL,
    Email VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) UNIQUE NOT NULL,
    CreationTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    AdminIndicator BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2) Author Table
CREATE TABLE IF NOT EXISTS Author (
    AuthorId SERIAL PRIMARY KEY,
    AuthorName VARCHAR(50) NOT NULL UNIQUE,
    AuthorBio VARCHAR(500)
);

-- 3) Publisher Table
CREATE TABLE IF NOT EXISTS Publisher (
    PublisherId SERIAL PRIMARY KEY,
    PublisherName VARCHAR(50) NOT NULL UNIQUE
);

-- 4) Books Table
CREATE TABLE IF NOT EXISTS Books (
    BookId SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL,
    authorID INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    genre VARCHAR(50) NOT NULL,
    publisherID INT,
    publishdate DATE NOT NULL,
    language VARCHAR(30) NOT NULL,
    pagecount INT NOT NULL,
    copiesavailable INT NOT NULL,
    imglink TEXT,
    ratedType VARCHAR(20) NOT NULL,
    description TEXT,
    CONSTRAINT fk_author FOREIGN KEY (authorID) REFERENCES Author(AuthorId),
    CONSTRAINT fk_publisher FOREIGN KEY (publisherID) REFERENCES Publisher(PublisherId)
);

-- 5) Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    BookingId SERIAL PRIMARY KEY,
    UserId VARCHAR(10) NOT NULL,
    BookId INT NOT NULL,
    BookingDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueDate TIMESTAMP NOT NULL,
    CurrentlyBookedIndicator BOOLEAN NOT NULL DEFAULT TRUE,
    pendingReturnIndicator BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_user_booking FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT fk_book_booking FOREIGN KEY (BookId) REFERENCES Books(BookId)
);

-- 6) Reservations Table
CREATE TABLE IF NOT EXISTS Reservations (
    ReservationId SERIAL PRIMARY KEY,
    UserId VARCHAR(10) NOT NULL,
    BookId INT NOT NULL,
    ReservationDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_reservation FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT fk_book_reservation FOREIGN KEY (BookId) REFERENCES Books(BookId)
);

-- 7) Reviews Table
CREATE TABLE IF NOT EXISTS Reviews (
    BookID INT NOT NULL,
    UserId VARCHAR(10) NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    ReviewDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReviewDescription TEXT,
    PRIMARY KEY (BookID, UserId),
    CONSTRAINT fk_book_review FOREIGN KEY (BookID) REFERENCES Books(BookId),
    CONSTRAINT fk_user_review FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- 8) TransactionHistory Table
CREATE TABLE IF NOT EXISTS TransactionHistory (
    TransactionId SERIAL PRIMARY KEY,
    UserId VARCHAR(10) NOT NULL,
    BookId INT NOT NULL,
    TransactionDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReservedIndicator BOOLEAN NOT NULL,
    CONSTRAINT fk_user_transaction FOREIGN KEY (UserId) REFERENCES Users(UserId),
    CONSTRAINT fk_book_transaction FOREIGN KEY (BookId) REFERENCES Books(BookId)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_username ON Users(Username);
CREATE INDEX IF NOT EXISTS idx_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_userid_bookings ON Bookings(UserId);
CREATE INDEX IF NOT EXISTS idx_bookid_bookings ON Bookings(BookId);
CREATE INDEX IF NOT EXISTS idx_userid_reservations ON Reservations(UserId);
CREATE INDEX IF NOT EXISTS idx_bookid_reservations ON Reservations(BookId);
CREATE INDEX IF NOT EXISTS idx_bookid_reviews ON Reviews(BookID);
CREATE INDEX IF NOT EXISTS idx_userid_reviews ON Reviews(UserId);
CREATE INDEX IF NOT EXISTS idx_userid_transactions ON TransactionHistory(UserId);
CREATE INDEX IF NOT EXISTS idx_bookid_transactions ON TransactionHistory(BookId);
