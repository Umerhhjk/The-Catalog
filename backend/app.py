from flask import Flask
from flask_cors import CORS
from login_signup import auth_bp, init_db

app = Flask(__name__)
CORS(app)

init_db()

app.register_blueprint(auth_bp)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)