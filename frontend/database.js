// Database configuration and connection setup
// This file provides the foundation for backend integration

class DatabaseConfig {
    constructor() {
        this.config = {
            // SQLite configuration (for development)
            sqlite: {
                filename: './database/library.db',
                options: {
                    verbose: console.log
                }
            },
            
            // MySQL configuration (for production)
            mysql: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'library_management',
                port: process.env.DB_PORT || 3306
            },
            
            // PostgreSQL configuration (alternative)
            postgresql: {
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'library_management',
                port: process.env.DB_PORT || 5432
            }
        };
    }

    // Get database configuration based on environment
    getConfig(dbType = 'sqlite') {
        return this.config[dbType];
    }
}

// Database schema for the library management system
const DatabaseSchema = {
    // Users table
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'librarian', 'student') NOT NULL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    
    // Books table
    books: `
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(200) NOT NULL,
            author VARCHAR(100) NOT NULL,
            isbn VARCHAR(20) UNIQUE,
            category VARCHAR(50),
            publisher VARCHAR(100),
            publication_year INTEGER,
            total_copies INTEGER DEFAULT 1,
            available_copies INTEGER DEFAULT 1,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    
    // Borrowings table
    borrowings: `
        CREATE TABLE IF NOT EXISTS borrowings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            borrow_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            due_date TIMESTAMP NOT NULL,
            return_date TIMESTAMP NULL,
            status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
            fine_amount DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
    `,
    
    // Categories table
    categories: `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `,
    
    // Fines table
    fines: `
        CREATE TABLE IF NOT EXISTS fines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            borrowing_id INTEGER NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            reason VARCHAR(200),
            status ENUM('pending', 'paid') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (borrowing_id) REFERENCES borrowings(id)
        )
    `
};

// API endpoints configuration
const APIEndpoints = {
    // Authentication endpoints
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        refresh: '/api/auth/refresh'
    },
    
    // User management endpoints
    users: {
        getAll: '/api/users',
        getById: '/api/users/:id',
        create: '/api/users',
        update: '/api/users/:id',
        delete: '/api/users/:id'
    },
    
    // Book management endpoints
    books: {
        getAll: '/api/books',
        getById: '/api/books/:id',
        create: '/api/books',
        update: '/api/books/:id',
        delete: '/api/books/:id',
        search: '/api/books/search'
    },
    
    // Borrowing endpoints
    borrowings: {
        getAll: '/api/borrowings',
        getByUser: '/api/borrowings/user/:userId',
        borrow: '/api/borrowings/borrow',
        return: '/api/borrowings/return/:id',
        renew: '/api/borrowings/renew/:id'
    },
    
    // Dashboard endpoints
    dashboard: {
        stats: '/api/dashboard/stats',
        recentActivity: '/api/dashboard/activity'
    }
};

// Sample data for testing
const SampleData = {
    users: [
        {
            full_name: 'Admin User',
            email: 'admin@thecatalog.com',
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        },
        {
            full_name: 'Librarian User',
            email: 'librarian@thecatalog.com',
            username: 'librarian',
            password: 'lib123',
            role: 'librarian'
        },
        {
            full_name: 'Student User',
            email: 'student@thecatalog.com',
            username: 'student',
            password: 'student123',
            role: 'student'
        }
    ],
    
    books: [
        {
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            isbn: '9780743273565',
            category: 'Fiction',
            publisher: 'Scribner',
            publication_year: 1925,
            total_copies: 5,
            available_copies: 4
        },
        {
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            isbn: '9780061120084',
            category: 'Fiction',
            publisher: 'J.B. Lippincott & Co.',
            publication_year: 1960,
            total_copies: 3,
            available_copies: 2
        },
        {
            title: '1984',
            author: 'George Orwell',
            isbn: '9780451524935',
            category: 'Fiction',
            publisher: 'Secker & Warburg',
            publication_year: 1949,
            total_copies: 4,
            available_copies: 3
        }
    ],
    
    categories: [
        { name: 'Fiction', description: 'Literary works of imagination' },
        { name: 'Non-Fiction', description: 'Factual and informative works' },
        { name: 'Science', description: 'Scientific and technical literature' },
        { name: 'History', description: 'Historical accounts and analysis' },
        { name: 'Biography', description: 'Life stories of notable people' }
    ]
};

// Export for use in backend implementation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DatabaseConfig,
        DatabaseSchema,
        APIEndpoints,
        SampleData
    };
} else {
    // Browser environment
    window.DatabaseConfig = DatabaseConfig;
    window.DatabaseSchema = DatabaseSchema;
    window.APIEndpoints = APIEndpoints;
    window.SampleData = SampleData;
}