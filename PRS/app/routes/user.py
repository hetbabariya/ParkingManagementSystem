from flask import Blueprint, request, jsonify, session
from app.models import database, Lot, Spot, Account, Reservation
from datetime import datetime
import pytz
from math import ceil

user_routes = Blueprint('user', __name__)

IST = pytz.timezone('Asia/Kolkata')

@user_routes.route('/user/lots', methods=['GET'])
def get_all_lots():
    all_lots = Lot.query.all()
    lots_data = []
    for lot in all_lots:
        occupied = Spot.query.filter_by(lot_id=lot.lot_id, availability='occupied').count()
        available = Spot.query.filter_by(lot_id=lot.lot_id, availability='available').count()
        lots_data.append({
            'lot_id': lot.lot_id,
            'lot_name': lot.lot_name,
            'lot_location': lot.lot_location,
            'pincode': lot.pincode,
            'hourly_rate': lot.hourly_rate,
            'total_spots': lot.total_spots,
            'occupied_spots': occupied,
            'available_spots': available
        })
    return jsonify({'lots': lots_data})

@user_routes.route('/user/lots/<int:lot_id>/book', methods=['POST'])
def reserve_parking_spot(lot_id):
    if 'account_id' not in session or session.get('role') != 'user':
        return jsonify({'error': 'Authentication required'}), 401

    account_id = session['account_id']
    data = request.get_json()
    vehicle_number = data.get('vehicle_number')

    available_spot = Spot.query.filter_by(lot_id=lot_id, availability='available').first()
    if not available_spot:
        return jsonify({'error': 'No free spots in the selected lot'}), 400

    now_ist = datetime.now(IST)
    new_reservation = Reservation(
        account_id=account_id,
        spot_id=available_spot.spot_id,
        vehicle_number=vehicle_number,
        checkin_time=now_ist,
        reservation_status='active'
    )

    database.session.add(new_reservation)
    database.session.commit()

    available_spot.availability = 'occupied'
    available_spot.active_reservation = new_reservation.reservation_id
    database.session.commit()

    return jsonify({
        'message': 'Spot successfully reserved.',
        'spot_id': available_spot.spot_id,
        'reservation_id': new_reservation.reservation_id,
        'checkin_time_ist': now_ist.strftime('%Y-%m-%d %H:%M:%S')
    })

@user_routes.route('/user/reservations/<int:reservation_id>/release', methods=['POST'])
def release_reserved_spot(reservation_id):
    if 'account_id' not in session or session.get('role') != 'user':
        return jsonify({'error': 'Authentication required'}), 401

    account_id = session['account_id']
    reservation = Reservation.query.get(reservation_id)

    if not reservation or reservation.account_id != account_id or reservation.reservation_status != 'active':
        return jsonify({'error': 'Reservation not found or not active'}), 404

    spot = Spot.query.get(reservation.spot_id)
    spot.availability = 'available'
    spot.active_reservation = None

    reservation.reservation_status = 'released'
    # Use IST for checkout time
    now_ist = datetime.now(IST)
    reservation.checkout_time = now_ist
    # Calculate payment
    checkin = reservation.checkin_time.astimezone(IST)
    checkout = now_ist
    duration_hours = (checkout - checkin).total_seconds() / 3600
    duration_hours_rounded = max(1, int(duration_hours + 0.999))
    lot = Lot.query.get(spot.lot_id)
    amount_due = duration_hours_rounded * lot.hourly_rate
    database.session.commit()
    return jsonify({
        'message': 'Reservation successfully released.',
        'duration_hours': duration_hours_rounded,
        'hourly_rate': lot.hourly_rate,
        'amount_due': amount_due,
        'checkin_time_ist': checkin.strftime('%Y-%m-%d %H:%M:%S'),
        'checkout_time_ist': now_ist.strftime('%Y-%m-%d %H:%M:%S')
    })

@user_routes.route('/user/reservations/<int:reservation_id>/release-summary', methods=['GET'])
def show_release_summary(reservation_id):
    if 'account_id' not in session or session.get('role') != 'user':
        return jsonify({'error': 'Authentication required'}), 401

    account_id = session['account_id']
    reservation = Reservation.query.get(reservation_id)

    if not reservation or reservation.account_id != account_id or reservation.reservation_status != 'active':
        return jsonify({'error': 'Reservation not found or not active'}), 404

    spot = Spot.query.get(reservation.spot_id)
    lot = Lot.query.get(spot.lot_id)
    now_ist = datetime.now(IST)
    checkin = reservation.checkin_time.astimezone(IST)
    duration_hours = (now_ist - checkin).total_seconds() / 3600
    duration_hours_rounded = max(1, int(duration_hours + 0.999))
    amount_due = duration_hours_rounded * lot.hourly_rate

    return jsonify({
        'reservation_id': reservation.reservation_id,
        'spot_id': spot.spot_id,
        'checkin_time_ist': checkin.strftime('%Y-%m-%d %H:%M:%S'),
        'current_time_ist': now_ist.strftime('%Y-%m-%d %H:%M:%S'),
        'duration_hours': duration_hours_rounded,
        'hourly_rate': lot.hourly_rate,
        'amount_due': amount_due,
        'status': reservation.reservation_status
    })

@user_routes.route('/user/history', methods=['GET'])
def fetch_reservation_history():
    if 'account_id' not in session or session.get('role') != 'user':
        return jsonify({'error': 'Authentication required'}), 401

    account_id = session['account_id']
    user_reservations = Reservation.query.filter_by(account_id=account_id)\
                                         .order_by(Reservation.checkin_time.desc()).all()

    history = []
    for res in user_reservations:
        checkin_ist = res.checkin_time.astimezone(IST) if res.checkin_time else None
        checkout_ist = res.checkout_time.astimezone(IST) if res.checkout_time else None
        history.append({
            'reservation_id': res.reservation_id,
            'spot_id': res.spot_id,
            'vehicle_number': res.vehicle_number,
            'checkin_time_ist': checkin_ist.strftime('%Y-%m-%d %H:%M:%S') if checkin_ist else None,
            'checkout_time_ist': checkout_ist.strftime('%Y-%m-%d %H:%M:%S') if checkout_ist else None,
            'status': res.reservation_status
        })

    return jsonify({'history': history})

@user_routes.route('/user/summary', methods=['GET'])
def user_summary():
    if 'account_id' not in session or session.get('role') != 'user':
        return jsonify({'error': 'Authentication required'}), 401
    account_id = session['account_id']
    reservations = Reservation.query.filter_by(account_id=account_id, reservation_status='released').all()
    total_bookings = len(reservations)
    total_paid = 0
    lot_stats = {}
    for r in reservations:
        spot = Spot.query.get(r.spot_id)
        lot = Lot.query.get(spot.lot_id) if spot else None
        if r.checkout_time and r.checkin_time and lot:
            duration = (r.checkout_time - r.checkin_time).total_seconds() / 3600
            hours = max(1, int(duration + 0.999))
            amount = hours * lot.hourly_rate
            total_paid += amount
            if lot.lot_name not in lot_stats:
                lot_stats[lot.lot_name] = {'bookings': 0, 'amount_paid': 0}
            lot_stats[lot.lot_name]['bookings'] += 1
            lot_stats[lot.lot_name]['amount_paid'] += amount
    return jsonify({
        'total_bookings': total_bookings,
        'total_paid': total_paid,
        'lots': lot_stats
    })
