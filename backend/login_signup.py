import os
import time

import psycopg2
from flask import Blueprint, jsonify, request
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)
CORS(auth_bp)

# Database configuration - reads from environment variables (Docker)
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'library_db'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', '1234'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def get_db_connection():
    """Create and return a database connection with retry logic"""
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            return conn
        except psycopg2.OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database connection attempt {attempt + 1} failed. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                print(f"Database connection error after {max_retries} attempts: {e}")
                return None

def init_db():
    """Initialize database with users table"""
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            cur.close()
            conn.close()
            print("Database initialized successfully")
        except Exception as e:
            print(f"Error initializing database: {e}")

@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    """Handle user registration"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Username, email, and password are required'
            }), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        
        password_hash = generate_password_hash(password)
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT id FROM users WHERE username = %s OR email = %s', (username, email))
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Username or email already exists'
            }), 409
        
        cur.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
            (username, email, password_hash)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during registration'
        }), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        username = data['username']
        password = data['password']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            'SELECT id, username, email, password_hash FROM users WHERE username = %s',
            (username,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        if not check_password_hash(user['password_hash'], password):
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email']
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during login'
        }), 500

@auth_bp.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    conn = get_db_connection()
    db_status = "connected" if conn else "disconnected"
    if conn:
        conn.close()
    
    return jsonify({
        'status': 'healthy',
        'message': 'Library Management System API is running',
        'database': db_status
    }), 200

@auth_bp.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users (for testing only)"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'DB connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, username, email, created_at FROM users')
        users = cur.fetchall()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'count': len(users),
            'users': users
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
