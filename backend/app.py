import os
import time

from db_helper import init_db
from flask import Flask
from flask_cors import CORS
from login_signup import auth_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp)

if __name__ == "__main__":
    print("⏳ Waiting for database to be ready...")
    time.sleep(3)
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
