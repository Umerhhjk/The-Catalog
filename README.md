# Booklore - Library Management System

A modern, responsive library management system with a beautiful UI and backend-ready architecture.

## Features

- **Beautiful Login/Signup Interface**: Modern gradient design with smooth animations
- **User Authentication**: Secure login and registration system
- **Role-based Access**: Support for Admin, Librarian, and Student roles
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Backend Ready**: Structured for easy backend integration

## Project Structure

```
lms/
├── index.html              # Login page
├── signup.html            # Registration page
├── dashboard.html         # Main dashboard
├── styles.css            # Main stylesheet
├── script.js             # Login page JavaScript
├── signup-script.js      # Signup page JavaScript
├── database.js           # Database configuration and schema
└── README.md             # This file
```

## Getting Started

### 1. Frontend Setup

1. Open `index.html` in your web browser
2. The login page will load with the beautiful gradient design
3. Use the following test credentials:
   - **Admin**: username: `admin`, password: `admin123`
   - **Librarian**: username: `librarian`, password: `lib123`
   - **Student**: username: `student`, password: `student123`

### 2. Backend Integration

The system is designed to work with various backend technologies:

#### Node.js + Express
```bash
npm init -y
npm install express sqlite3 bcryptjs jsonwebtoken cors
```

#### Python + Flask/Django
```bash
pip install flask sqlite3 bcrypt
```

#### PHP + MySQL
- Use the provided database schema in `database.js`
- Implement the API endpoints as defined

### 3. Database Setup

The system supports multiple database types:

- **SQLite** (for development)
- **MySQL** (for production)
- **PostgreSQL** (alternative)

Use the schema provided in `database.js` to create your database tables.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Book Management
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Add new book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book
- `GET /api/books/search` - Search books

### Borrowing System
- `GET /api/borrowings` - Get all borrowings
- `GET /api/borrowings/user/:userId` - Get user's borrowings
- `POST /api/borrowings/borrow` - Borrow a book
- `PUT /api/borrowings/return/:id` - Return a book
- `PUT /api/borrowings/renew/:id` - Renew a book

## Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- The design uses CSS custom properties for easy theming
- Bootstrap 5.3.2 is included for additional components

### Functionality
- Update `script.js` and `signup-script.js` for custom validation
- Modify the `AuthAPI` class for your backend integration
- Add new features by extending the existing structure

## Security Considerations

- Passwords should be hashed using bcrypt or similar
- Implement JWT tokens for session management
- Add input validation and sanitization
- Use HTTPS in production
- Implement rate limiting for API endpoints

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
## Support

For questions or support, please contact the development team or create an issue in the repository.

