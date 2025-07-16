from flask import Blueprint, request, jsonify, session
from app.models import database, Account
from werkzeug.security import generate_password_hash, check_password_hash

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 200
    payload = request.get_json()
    if not payload or not payload.get('email_address') or not payload.get('user_password'):
        return jsonify({'error': 'Both email and password must be provided.'}), 400

    existing_user = Account.query.filter_by(email_address=payload['email_address']).first()
    if existing_user:
        return jsonify({'error': 'This email is already registered.'}), 409

    new_account = Account(
        email_address=payload['email_address'],
        pwd_hash=generate_password_hash(payload['user_password']),
        full_name=payload.get('full_name'),
        address=payload.get('address'),
        postal_code=payload.get('postal_code'),
        role='user'
    )

    database.session.add(new_account)
    database.session.commit()
    return jsonify({'message': 'User registered successfully.'}), 201

# @auth_routes.route('/register', methods=['POST', 'OPTIONS'])
# def register():
#     if request.method == 'OPTIONS':
#         return '', 200
#     payload = request.get_json()
#     if not payload or not payload.get('email_address') or not payload.get('user_password'):
#         return jsonify({'error': 'Both email and password must be provided.'}), 400

#     existing_user = Account.query.filter_by(email_address=payload['email_address']).first()
#     if existing_user:
#         return jsonify({'error': 'This email is already registered.'}), 409

#     new_account = Account(
#         email_address=payload['email_address'],
#         pwd_hash=generate_password_hash(payload['user_password']),
#         full_name=payload.get('full_name'),
#         address=payload.get('address'),
#         postal_code=payload.get('postal_code'),
#         role='user'
#     )

#     database.session.add(new_account)
#     database.session.commit()
#     return jsonify({'message': 'User registered successfully.'}), 201

@auth_routes.route('/signin', methods=['POST', 'OPTIONS'])
def signin():
    if request.method == 'OPTIONS':
        return '', 200
    credentials = request.get_json()
    if not credentials or not credentials.get('email_address') or not credentials.get('user_password'):
        return jsonify({'error': 'Email and password must be included.'}), 400

    account = Account.query.filter_by(email_address=credentials['email_address']).first()
    if account and check_password_hash(account.pwd_hash, credentials['user_password']):
        session['account_id'] = account.account_id
        session['role'] = account.role
        return jsonify({'message': 'Login successful.', 'role': account.role}), 200

    return jsonify({'error': 'Incorrect credentials.'}), 401

# @auth_routes.route('/login', methods=['POST', 'OPTIONS'])
# def login():
#     if request.method == 'OPTIONS':
#         return '', 200
#     credentials = request.get_json()
#     if not credentials or not credentials.get('email_address') or not credentials.get('user_password'):
#         return jsonify({'error': 'Email and password must be included.'}), 400

#     account = Account.query.filter_by(email_address=credentials['email_address']).first()
#     if account and check_password_hash(account.pwd_hash, credentials['user_password']):
#         session['account_id'] = account.account_id
#         session['role'] = account.role
#         return jsonify({'message': 'Login successful.', 'role': account.role}), 200

#     return jsonify({'error': 'Incorrect credentials.'}), 401

@auth_routes.route('/signout', methods=['POST', 'OPTIONS'])
def signout():
    if request.method == 'OPTIONS':
        return '', 200
    session.clear()
    return jsonify({'message': 'You have been logged out.'}), 200
