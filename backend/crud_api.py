from datetime import datetime

from db_helper import get_db_connection
from flask import Blueprint, jsonify, request
from psycopg2.extras import RealDictCursor

crud_bp = Blueprint('crud', __name__)

# =========================================USERS TABLE CRUD=========================================

@crud_bp.route('/api/users', methods=['GET'])
def get_users():
    """Get all users or a specific user by UserId"""
    try:
        user_id = request.args.get('user_id')
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if user_id:
            cur.execute('SELECT * FROM Users WHERE UserId = %s', (user_id,))
            user = cur.fetchone()
            cur.close()
            conn.close()
            
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            return jsonify({'success': True, 'user': user}), 200
        else:
            cur.execute('SELECT * FROM Users')
            users = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(users), 'users': users}), 200
            
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        required_fields = ['UserId', 'Username', 'Email', 'PasswordHash']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT UserId FROM Users WHERE UserId = %s', (data['UserId'],))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'UserId already exists'}), 409
        
        cur.execute('''
            INSERT INTO Users (UserId, Username, Email, PasswordHash, AdminIndicator, CreationTime)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING UserId
        ''', (
            data['UserId'],
            data['Username'],
            data['Email'],
            data['PasswordHash'],
            data.get('AdminIndicator', False),
            data.get('CreationTime', datetime.now())
        ))
        
        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'User created successfully', 'user_id': user_id}), 201
        
    except Exception as e:
        print(f"Create user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update an existing user"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT UserId FROM Users WHERE UserId = %s', (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        update_fields = []
        values = []
        
        allowed_fields = ['Username', 'Email', 'PasswordHash', 'AdminIndicator']
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(user_id)
        query = f"UPDATE Users SET {', '.join(update_fields)} WHERE UserId = %s RETURNING UserId"
        
        cur.execute(query, values)
        updated_user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'User updated successfully', 'user_id': updated_user_id}), 200
        
    except Exception as e:
        print(f"Update user error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ===================================AUTHOR TABLE CRUD===================================

@crud_bp.route('/api/authors', methods=['GET'])
def get_authors():
    """Get all authors or a specific author by AuthorId"""
    try:
        author_id = request.args.get('author_id')
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if author_id:
            cur.execute('SELECT * FROM Author WHERE AuthorId = %s', (author_id,))
            author = cur.fetchone()
            cur.close()
            conn.close()
            
            if not author:
                return jsonify({'success': False, 'message': 'Author not found'}), 404
            
            return jsonify({'success': True, 'author': author}), 200
        else:
            cur.execute('SELECT * FROM Author')
            authors = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(authors), 'authors': authors}), 200
            
    except Exception as e:
        print(f"Get authors error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/authors', methods=['POST'])
def create_author():
    """Create a new author"""
    try:
        data = request.get_json()
        if not data or not data.get('AuthorName'):
            return jsonify({'success': False, 'message': 'AuthorName is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO Author (AuthorName, AuthorBio)
            VALUES (%s, %s)
            RETURNING AuthorId
        ''', (
            data['AuthorName'],
            data.get('AuthorBio')
        ))
        
        author_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Author created successfully', 'author_id': author_id}), 201
        
    except Exception as e:
        print(f"Create author error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/authors/<int:author_id>', methods=['PUT'])
def update_author(author_id):
    """Update an existing author"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT AuthorId FROM Author WHERE AuthorId = %s', (author_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Author not found'}), 404
        
        update_fields = []
        values = []
        
        if 'AuthorName' in data:
            update_fields.append("AuthorName = %s")
            values.append(data['AuthorName'])
        
        if 'AuthorBio' in data:
            update_fields.append("AuthorBio = %s")
            values.append(data['AuthorBio'])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(author_id)
        query = f"UPDATE Author SET {', '.join(update_fields)} WHERE AuthorId = %s RETURNING AuthorId"
        
        cur.execute(query, values)
        updated_author_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Author updated successfully', 'author_id': updated_author_id}), 200
        
    except Exception as e:
        print(f"Update author error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================PUBLISHER TABLE CRUD=========================================

@crud_bp.route('/api/publishers', methods=['GET'])
def get_publishers():
    """Get all publishers or a specific publisher by PublisherId"""
    try:
        publisher_id = request.args.get('publisher_id')
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if publisher_id:
            cur.execute('SELECT * FROM Publisher WHERE PublisherId = %s', (publisher_id,))
            publisher = cur.fetchone()
            cur.close()
            conn.close()
            
            if not publisher:
                return jsonify({'success': False, 'message': 'Publisher not found'}), 404
            
            return jsonify({'success': True, 'publisher': publisher}), 200
        else:
            cur.execute('SELECT * FROM Publisher')
            publishers = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(publishers), 'publishers': publishers}), 200
            
    except Exception as e:
        print(f"Get publishers error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/publishers', methods=['POST'])
def create_publisher():
    """Create a new publisher"""
    try:
        data = request.get_json()
        if not data or not data.get('PublisherName'):
            return jsonify({'success': False, 'message': 'PublisherName is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('''
            INSERT INTO Publisher (PublisherName)
            VALUES (%s)
            RETURNING PublisherId
        ''', (data['PublisherName'],))
        
        publisher_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Publisher created successfully', 'publisher_id': publisher_id}), 201
        
    except Exception as e:
        print(f"Create publisher error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/publishers/<int:publisher_id>', methods=['PUT'])
def update_publisher(publisher_id):
    """Update an existing publisher"""
    try:
        data = request.get_json()
        if not data or not data.get('PublisherName'):
            return jsonify({'success': False, 'message': 'PublisherName is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT PublisherId FROM Publisher WHERE PublisherId = %s', (publisher_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Publisher not found'}), 404
        
        cur.execute('''
            UPDATE Publisher SET PublisherName = %s
            WHERE PublisherId = %s
            RETURNING PublisherId
        ''', (data['PublisherName'], publisher_id))
        
        updated_publisher_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Publisher updated successfully', 'publisher_id': updated_publisher_id}), 200
        
    except Exception as e:
        print(f"Update publisher error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ===================================BOOKS TABLE CRUD===================================

@crud_bp.route('/api/books', methods=['GET'])
def get_books():
    """Get all books or a specific book by BookId"""
    try:
        book_id = request.args.get('book_id')
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if book_id:
            cur.execute('SELECT * FROM Books WHERE BookId = %s', (book_id,))
            book = cur.fetchone()
            cur.close()
            conn.close()
            
            if not book:
                return jsonify({'success': False, 'message': 'Book not found'}), 404
            
            return jsonify({'success': True, 'book': book}), 200
        else:
            cur.execute('SELECT * FROM Books')
            books = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(books), 'books': books}), 200
            
    except Exception as e:
        print(f"Get books error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/books', methods=['POST'])
def create_book():
    """Create a new book"""
    try:
        data = request.get_json()
        required_fields = ['Name', 'authorName', 'category', 'genre', 'publishdate', 'language', 'pagecount', 'copiesavailable', 'ratedType']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        # Get or create author
        cur.execute('SELECT AuthorId FROM Author WHERE AuthorName = %s', (data['authorName'],))
        author_result = cur.fetchone()
        
        if not author_result:
            # Author doesn't exist, create it
            cur.execute('''
                INSERT INTO Author (AuthorName, AuthorBio)
                VALUES (%s, %s)
                RETURNING AuthorId
            ''', (data['authorName'], None))
            author_id = cur.fetchone()[0]
        else:
            author_id = author_result[0]
        
        # Get or create publisher if provided
        publisher_id = None
        if data.get('publisherName'):
            cur.execute('SELECT PublisherId FROM Publisher WHERE PublisherName = %s', (data['publisherName'],))
            publisher_result = cur.fetchone()
            
            if not publisher_result:
                # Publisher doesn't exist, create it
                cur.execute('''
                    INSERT INTO Publisher (PublisherName)
                    VALUES (%s)
                    RETURNING PublisherId
                ''', (data['publisherName'],))
                publisher_id = cur.fetchone()[0]
            else:
                publisher_id = publisher_result[0]
        
        publish_date = data['publishdate']
        if isinstance(publish_date, str):
            publish_date = datetime.strptime(publish_date, '%Y-%m-%d').date()
        
        cur.execute('''
            INSERT INTO Books (Name, authorID, category, genre, publisherID, publishdate, language, pagecount, copiesavailable, imglink, ratedType, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING BookId
        ''', (
            data['Name'],
            author_id,
            data['category'],
            data['genre'],
            publisher_id,
            publish_date,
            data['language'],
            data['pagecount'],
            data['copiesavailable'],
            data.get('imglink'),
            data['ratedType'],
            data.get('description')
        ))
        
        book_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Book created successfully', 'book_id': book_id}), 201
        
    except Exception as e:
        print(f"Create book error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    """Update an existing book"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT BookId FROM Books WHERE BookId = %s', (book_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Book not found'}), 404
        
        update_fields = []
        values = []
        
        allowed_fields = ['Name', 'authorID', 'category', 'genre', 'publisherID', 'publishdate', 
                         'language', 'pagecount', 'copiesavailable', 'imglink', 'ratedType', 'description']
        
        for field in allowed_fields:
            if field in data:
                if field == 'publishdate' and isinstance(data[field], str):
                    update_fields.append(f"{field} = %s")
                    values.append(datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(book_id)
        query = f"UPDATE Books SET {', '.join(update_fields)} WHERE BookId = %s RETURNING BookId"
        
        cur.execute(query, values)
        updated_book_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Book updated successfully', 'book_id': updated_book_id}), 200
        
    except Exception as e:
        print(f"Update book error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================BOOKINGS TABLE CRUD============================================

@crud_bp.route('/api/bookings', methods=['GET'])
def get_bookings():
    """Get all bookings or a specific booking by BookingId"""
    try:
        booking_id = request.args.get('booking_id')
        user_id = request.args.get('user_id')
        book_id = request.args.get('book_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if booking_id:
            cur.execute('SELECT * FROM Bookings WHERE BookingId = %s', (booking_id,))
            booking = cur.fetchone()
            cur.close()
            conn.close()
            
            if not booking:
                return jsonify({'success': False, 'message': 'Booking not found'}), 404
            
            return jsonify({'success': True, 'booking': booking}), 200
        elif user_id:
            cur.execute('SELECT * FROM Bookings WHERE UserId = %s', (user_id,))
            bookings = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(bookings), 'bookings': bookings}), 200
        elif book_id:
            cur.execute('SELECT * FROM Bookings WHERE BookId = %s', (book_id,))
            bookings = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(bookings), 'bookings': bookings}), 200
        else:
            cur.execute('SELECT * FROM Bookings')
            bookings = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(bookings), 'bookings': bookings}), 200
            
    except Exception as e:
        print(f"Get bookings error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    try:
        data = request.get_json()
        required_fields = ['UserId', 'BookId', 'dueDate']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        due_date = data['dueDate']
        if isinstance(due_date, str):
            due_date = datetime.strptime(due_date, '%Y-%m-%d %H:%M:%S')
        
        booking_date = data.get('BookingDate', datetime.now())
        if isinstance(booking_date, str):
            booking_date = datetime.strptime(booking_date, '%Y-%m-%d %H:%M:%S')
        
        cur.execute('''
            INSERT INTO Bookings (UserId, BookId, BookingDate, dueDate, CurrentlyBookedIndicator, pendingReturnIndicator)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING BookingId
        ''', (
            data['UserId'],
            data['BookId'],
            booking_date,
            due_date,
            data.get('CurrentlyBookedIndicator', True),
            data.get('pendingReturnIndicator', False)
        ))
        
        booking_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Booking created successfully', 'booking_id': booking_id}), 201
        
    except Exception as e:
        print(f"Create booking error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/bookings/<int:booking_id>', methods=['PUT'])
def update_booking(booking_id):
    """Update an existing booking"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT BookingId FROM Bookings WHERE BookingId = %s', (booking_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Booking not found'}), 404
        
        update_fields = []
        values = []
        
        allowed_fields = ['UserId', 'BookId', 'BookingDate', 'dueDate', 'CurrentlyBookedIndicator', 'pendingReturnIndicator']
        
        for field in allowed_fields:
            if field in data:
                if field in ['BookingDate', 'dueDate'] and isinstance(data[field], str):
                    update_fields.append(f"{field} = %s")
                    values.append(datetime.strptime(data[field], '%Y-%m-%d %H:%M:%S'))
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(booking_id)
        query = f"UPDATE Bookings SET {', '.join(update_fields)} WHERE BookingId = %s RETURNING BookingId"
        
        cur.execute(query, values)
        updated_booking_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Booking updated successfully', 'booking_id': updated_booking_id}), 200
        
    except Exception as e:
        print(f"Update booking error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================RESERVATIONS TABLE CRUD==========================================

@crud_bp.route('/api/reservations', methods=['GET'])
def get_reservations():
    """Get all reservations or filter by UserId or BookId"""
    try:
        reservation_id = request.args.get('reservation_id')
        user_id = request.args.get('user_id')
        book_id = request.args.get('book_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if reservation_id:
            cur.execute('SELECT * FROM Reservations WHERE ReservationId = %s', (reservation_id,))
            reservation = cur.fetchone()
            cur.close()
            conn.close()
            
            if not reservation:
                return jsonify({'success': False, 'message': 'Reservation not found'}), 404
            
            return jsonify({'success': True, 'reservation': reservation}), 200
        elif user_id:
            cur.execute('SELECT * FROM Reservations WHERE UserId = %s', (user_id,))
            reservations = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(reservations), 'reservations': reservations}), 200
        elif book_id:
            cur.execute('SELECT * FROM Reservations WHERE BookId = %s', (book_id,))
            reservations = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(reservations), 'reservations': reservations}), 200
        else:
            cur.execute('SELECT * FROM Reservations')
            reservations = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(reservations), 'reservations': reservations}), 200
            
    except Exception as e:
        print(f"Get reservations error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/reservations', methods=['POST'])
def create_reservation():
    """Create a new reservation"""
    try:
        data = request.get_json()
        required_fields = ['UserId', 'BookId']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        reservation_date = data.get('ReservationDate', datetime.now())
        if isinstance(reservation_date, str):
            reservation_date = datetime.strptime(reservation_date, '%Y-%m-%d %H:%M:%S')
        
        cur.execute('''
            INSERT INTO Reservations (UserId, BookId, ReservationDate)
            VALUES (%s, %s, %s)
            RETURNING ReservationId
        ''', (
            data['UserId'],
            data['BookId'],
            reservation_date
        ))
        
        reservation_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Reservation created successfully', 'reservation_id': reservation_id}), 201
        
    except Exception as e:
        print(f"Create reservation error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/reservations/<int:reservation_id>', methods=['PUT'])
def update_reservation(reservation_id):
    """Update an existing reservation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT ReservationId FROM Reservations WHERE ReservationId = %s', (reservation_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Reservation not found'}), 404
        
        update_fields = []
        values = []
        
        allowed_fields = ['UserId', 'BookId', 'ReservationDate']
        
        for field in allowed_fields:
            if field in data:
                if field == 'ReservationDate' and isinstance(data[field], str):
                    update_fields.append(f"{field} = %s")
                    values.append(datetime.strptime(data[field], '%Y-%m-%d %H:%M:%S'))
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(reservation_id)
        query = f"UPDATE Reservations SET {', '.join(update_fields)} WHERE ReservationId = %s RETURNING ReservationId"
        
        cur.execute(query, values)
        updated_reservation_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Reservation updated successfully', 'reservation_id': updated_reservation_id}), 200
        
    except Exception as e:
        print(f"Update reservation error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================REVIEWS TABLE CRUD=========================================

@crud_bp.route('/api/reviews', methods=['GET'])
def get_reviews():
    """Get all reviews or filter by BookID or UserId"""
    try:
        book_id = request.args.get('book_id')
        user_id = request.args.get('user_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if book_id and user_id:
            cur.execute('SELECT * FROM Reviews WHERE BookID = %s AND UserId = %s', (book_id, user_id))
            review = cur.fetchone()
            cur.close()
            conn.close()
            
            if not review:
                return jsonify({'success': False, 'message': 'Review not found'}), 404
            
            return jsonify({'success': True, 'review': review}), 200
        elif book_id:
            cur.execute('SELECT * FROM Reviews WHERE BookID = %s', (book_id,))
            reviews = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(reviews), 'reviews': reviews}), 200
        elif user_id:
            cur.execute('SELECT * FROM Reviews WHERE UserId = %s', (user_id,))
            reviews = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(reviews), 'reviews': reviews}), 200
        else:
            cur.execute('SELECT * FROM Reviews')
            reviews = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(reviews), 'reviews': reviews}), 200
            
    except Exception as e:
        print(f"Get reviews error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/reviews', methods=['POST'])
def create_review():
    """Create a new review"""
    try:
        data = request.get_json()
        required_fields = ['BookID', 'UserId', 'Rating']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        rating = data['Rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'success': False, 'message': 'Rating must be an integer between 1 and 5'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        review_date = data.get('ReviewDate', datetime.now())
        if isinstance(review_date, str):
            review_date = datetime.strptime(review_date, '%Y-%m-%d %H:%M:%S')
        
        cur.execute('''
            INSERT INTO Reviews (BookID, UserId, Rating, ReviewDate, ReviewDescription)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (BookID, UserId) DO UPDATE SET
                Rating = EXCLUDED.Rating,
                ReviewDate = EXCLUDED.ReviewDate,
                ReviewDescription = EXCLUDED.ReviewDescription
            RETURNING BookID, UserId
        ''', (
            data['BookID'],
            data['UserId'],
            rating,
            review_date,
            data.get('ReviewDescription')
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Review created/updated successfully', 
            'book_id': result[0],
            'user_id': result[1]
        }), 201
        
    except Exception as e:
        print(f"Create review error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/reviews', methods=['PUT'])
def update_review():
    """Update an existing review (requires both BookID and UserId)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        if 'BookID' not in data or 'UserId' not in data:
            return jsonify({'success': False, 'message': 'BookID and UserId are required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT BookID, UserId FROM Reviews WHERE BookID = %s AND UserId = %s', 
                    (data['BookID'], data['UserId']))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Review not found'}), 404
        
        update_fields = []
        values = []
        
        if 'Rating' in data:
            rating = data['Rating']
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                cur.close()
                conn.close()
                return jsonify({'success': False, 'message': 'Rating must be an integer between 1 and 5'}), 400
            update_fields.append("Rating = %s")
            values.append(rating)
        
        if 'ReviewDate' in data:
            review_date = data['ReviewDate']
            if isinstance(review_date, str):
                review_date = datetime.strptime(review_date, '%Y-%m-%d %H:%M:%S')
            update_fields.append("ReviewDate = %s")
            values.append(review_date)
        
        if 'ReviewDescription' in data:
            update_fields.append("ReviewDescription = %s")
            values.append(data['ReviewDescription'])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.extend([data['BookID'], data['UserId']])
        query = f"UPDATE Reviews SET {', '.join(update_fields)} WHERE BookID = %s AND UserId = %s RETURNING BookID, UserId"
        
        cur.execute(query, values)
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': 'Review updated successfully', 
            'book_id': result[0],
            'user_id': result[1]
        }), 200
        
    except Exception as e:
        print(f"Update review error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ========================================TRANSACTIONHISTORY TABLE CRUD========================================

@crud_bp.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions or filter by UserId or BookId"""
    try:
        transaction_id = request.args.get('transaction_id')
        user_id = request.args.get('user_id')
        book_id = request.args.get('book_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if transaction_id:
            cur.execute('SELECT * FROM TransactionHistory WHERE TransactionId = %s', (transaction_id,))
            transaction = cur.fetchone()
            cur.close()
            conn.close()
            
            if not transaction:
                return jsonify({'success': False, 'message': 'Transaction not found'}), 404
            
            return jsonify({'success': True, 'transaction': transaction}), 200
        elif user_id:
            cur.execute('SELECT * FROM TransactionHistory WHERE UserId = %s', (user_id,))
            transactions = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(transactions), 'transactions': transactions}), 200
        elif book_id:
            cur.execute('SELECT * FROM TransactionHistory WHERE BookId = %s', (book_id,))
            transactions = cur.fetchall()
            cur.close()
            conn.close()
            return jsonify({'success': True, 'count': len(transactions), 'transactions': transactions}), 200
        else:
            cur.execute('SELECT * FROM TransactionHistory')
            transactions = cur.fetchall()
            cur.close()
            conn.close()
            
            return jsonify({'success': True, 'count': len(transactions), 'transactions': transactions}), 200
            
    except Exception as e:
        print(f"Get transactions error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/transactions', methods=['POST'])
def create_transaction():
    """Create a new transaction"""
    try:
        data = request.get_json()
        required_fields = ['UserId', 'BookId', 'ReservedIndicator']
        
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'message': f'{field} is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        transaction_date = data.get('TransactionDate', datetime.now())
        if isinstance(transaction_date, str):
            transaction_date = datetime.strptime(transaction_date, '%Y-%m-%d %H:%M:%S')
        
        cur.execute('''
            INSERT INTO TransactionHistory (UserId, BookId, TransactionDate, ReservedIndicator)
            VALUES (%s, %s, %s, %s)
            RETURNING TransactionId
        ''', (
            data['UserId'],
            data['BookId'],
            transaction_date,
            data['ReservedIndicator']
        ))
        
        transaction_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Transaction created successfully', 'transaction_id': transaction_id}), 201
        
    except Exception as e:
        print(f"Create transaction error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@crud_bp.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    """Update an existing transaction"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500
        
        cur = conn.cursor()
        
        cur.execute('SELECT TransactionId FROM TransactionHistory WHERE TransactionId = %s', (transaction_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Transaction not found'}), 404
        
        update_fields = []
        values = []
        
        allowed_fields = ['UserId', 'BookId', 'TransactionDate', 'ReservedIndicator']
        
        for field in allowed_fields:
            if field in data:
                if field == 'TransactionDate' and isinstance(data[field], str):
                    update_fields.append(f"{field} = %s")
                    values.append(datetime.strptime(data[field], '%Y-%m-%d %H:%M:%S'))
                else:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
        
        if not update_fields:
            cur.close()
            conn.close()
            return jsonify({'success': False, 'message': 'No valid fields to update'}), 400
        
        values.append(transaction_id)
        query = f"UPDATE TransactionHistory SET {', '.join(update_fields)} WHERE TransactionId = %s RETURNING TransactionId"
        
        cur.execute(query, values)
        updated_transaction_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Transaction updated successfully', 'transaction_id': updated_transaction_id}), 200
        
    except Exception as e:
        print(f"Update transaction error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

