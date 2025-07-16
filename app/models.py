from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

database = SQLAlchemy()

class Account(database.Model):
    __tablename__ = 'accounts'
    account_id = database.Column(database.Integer, primary_key=True)
    email_address = database.Column(database.String(120), unique=True, nullable=False)
    pwd_hash = database.Column(database.String(128), nullable=False)
    full_name = database.Column(database.String(100))
    address = database.Column(database.String(200))
    postal_code = database.Column(database.String(10))
    role = database.Column(database.String(15), nullable=False)
    reservations = database.relationship('Reservation', backref='account_ref', lazy=True)

class Lot(database.Model):
    __tablename__ = 'lots'
    lot_id = database.Column(database.Integer, primary_key=True)
    lot_name = database.Column(database.String(100), unique=True, nullable=False)
    lot_location = database.Column(database.String(200), nullable=False)
    pincode = database.Column(database.String(10), nullable=False)
    hourly_rate = database.Column(database.Float, nullable=False)
    total_spots = database.Column(database.Integer, nullable=False)
    spots = database.relationship('Spot', backref='associated_lot', lazy=True, cascade='all, delete-orphan')

class Spot(database.Model):
    __tablename__ = 'spots'
    spot_id = database.Column(database.Integer, primary_key=True)
    lot_id = database.Column(database.Integer, database.ForeignKey('lots.lot_id'), nullable=False)
    identifier = database.Column(database.Integer, nullable=False)
    availability = database.Column(database.String(15), nullable=False)
    active_reservation = database.Column(database.Integer, database.ForeignKey('reservations.reservation_id'), nullable=True)

class Reservation(database.Model):
    __tablename__ = 'reservations'
    reservation_id = database.Column(database.Integer, primary_key=True)
    account_id = database.Column(database.Integer, database.ForeignKey('accounts.account_id'), nullable=False)
    spot_id = database.Column(database.Integer, database.ForeignKey('spots.spot_id'), nullable=False)
    vehicle_number = database.Column(database.String(20), nullable=False)
    checkin_time = database.Column(database.DateTime, default=datetime.utcnow)
    checkout_time = database.Column(database.DateTime, nullable=True)
    reservation_status = database.Column(database.String(15), nullable=False)
