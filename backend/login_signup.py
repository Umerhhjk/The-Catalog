import secrets
import string

from db_helper import get_db_connection
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)

def generate_user_id():
    """Generate a unique 10-character UserId"""
    max_attempts = 10
    for _ in range(max_attempts):
        user_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(10))
        
        conn = get_db_connection()
        if conn:
            try:
                cur = conn.cursor()
                cur.execute('SELECT UserId FROM Users WHERE UserId = %s', (user_id,))
                if not cur.fetchone():
                    cur.close()
                    conn.close()
                    return user_id
                cur.close()
            except Exception:
                pass
            finally:
                conn.close()
    
    import time
    return f"USR{int(time.time()) % 1000000000:010d}"[:10]

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
        
        cur.execute('SELECT UserId FROM Users WHERE Username = %s OR Email = %s', (username, email))
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Username or email already exists'
            }), 409
        
        user_id = generate_user_id()
        
        cur.execute(
            'INSERT INTO Users (UserId, Username, Email, PasswordHash, AdminIndicator) VALUES (%s, %s, %s, %s, %s) RETURNING UserId',
            (user_id, username, email, password_hash, False)
        )
        returned_user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': returned_user_id
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
            'SELECT UserId, Username, Email, PasswordHash FROM Users WHERE Username = %s',
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
        
        if not check_password_hash(user['passwordhash'], password):
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user['userid'],
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

@auth_bp.route('/api/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        username = data.get('username')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not all([username, current_password, new_password]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400
        
        if len(new_password) < 8:
            return jsonify({
                'success': False,
                'message': 'New password must be at least 8 characters long'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute(
            'SELECT UserId, PasswordHash FROM Users WHERE Username = %s',
            (username,)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if not check_password_hash(user['passwordhash'], current_password):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect'
            }), 401
        
        new_password_hash = generate_password_hash(new_password)
        cursor.execute(
            'UPDATE Users SET PasswordHash = %s WHERE UserId = %s',
            (new_password_hash, user['userid'])
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully'
        }), 200
        
    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred while changing password'
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
        cur.execute('SELECT UserId, Username, Email, CreationTime FROM Users')
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
    

