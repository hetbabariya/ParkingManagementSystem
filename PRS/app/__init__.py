from flask import Flask
from app.config import Config
from app.models import database
from app.routes.auth import auth_routes
from app.routes.user import user_routes
from app.routes.admin import admin_routes
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize database
    database.init_app(app)

    # Register blueprints
    app.register_blueprint(auth_routes, url_prefix='/auth')
    app.register_blueprint(user_routes)
    app.register_blueprint(admin_routes)

    # Register CORS AFTER all blueprints
    CORS(app, supports_credentials=True, origins=["*","http://127.0.0.1:5500","https://chic-melomakarona-8d423f.netlify.app/"])

    return app