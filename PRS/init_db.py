from flask import Flask
from app.config import Config
from app.models import Account, database
from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.config.from_object(Config)

database.init_app(app)

def create_admin_account():
    default_email = 'admin@parking.com'
    default_password = 'admin123'

    existing_admin = Account.query.filter_by(email_address=default_email).first()
    if not existing_admin:
        admin_user = Account(
            email_address=default_email,
            pwd_hash=generate_password_hash(default_password),
            full_name='Administrator',
            address='Head Office',
            postal_code='000000',
            role='admin'
        )
        database.session.add(admin_user)
        database.session.commit()
        print("Admin account has been created.")
    else:
        print("Admin account already exists.")

with app.app_context():
    database.create_all()
    create_admin_account()
    print("Database tables created and admin setup complete.")
