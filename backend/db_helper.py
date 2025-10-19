import os
import time

import psycopg2

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "library_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "1234"),
    "port": int(os.getenv("DB_PORT", 5432))
}

def get_db_connection():
    """Create and return a database connection with retry logic."""
    max_retries = 5
    retry_delay = 5
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            return conn
        except psycopg2.OperationalError:
            print(f"DB connection attempt {attempt + 1} failed. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
    print("❌ Could not connect to the database after retries.")
    return None

def init_db():
    """Initialize the users table if it doesn't exist."""
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
                );
            ''')
            conn.commit()
            print("✅ Database initialized successfully.")
        except Exception as e:
            print(f"❌ Database initialization error: {e}")
        finally:
            cur.close()
            conn.close()
    else:
        print("❌ Database connection not available during init.")
