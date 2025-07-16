from flask import Blueprint, request, jsonify, session
from app.models import database, Lot, Spot, Account, Reservation
from datetime import datetime
import pytz

admin_routes = Blueprint('admin', __name__)

IST = pytz.timezone('Asia/Kolkata')

@admin_routes.route('/admin/lots', methods=['GET'])
def fetch_all_parking_lots():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    lots = Lot.query.all()
    result = []
    for lot in lots:
        occupied = Spot.query.filter_by(lot_id=lot.lot_id, availability='occupied').count()
        available = Spot.query.filter_by(lot_id=lot.lot_id, availability='available').count()
        result.append({
            'lot_id': lot.lot_id,
            'lot_name': lot.lot_name,
            'lot_location': lot.lot_location,
            'pincode': lot.pincode,
            'hourly_rate': lot.hourly_rate,
            'total_spots': lot.total_spots,
            'occupied_spots': occupied,
            'available_spots': available
        })
    return jsonify({'lots': result})

@admin_routes.route('/admin/lots', methods=['POST'])
def create_parking_lot():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    # Check for unique lot_name
    if Lot.query.filter_by(lot_name=data.get('lot_name')).first():
        return jsonify({'error': 'Lot name already exists. Please choose a different name.'}), 400
    new_lot = Lot(
        lot_name=data.get('lot_name'),
        lot_location=data.get('lot_location'),
        pincode=data.get('pincode'),
        hourly_rate=data.get('hourly_rate'),
        total_spots=data.get('total_spots')
    )
    database.session.add(new_lot)
    database.session.commit()
    # Pre-create spots for this lot
    for i in range(1, new_lot.total_spots + 1):
        spot = Spot(
            lot_id=new_lot.lot_id,
            identifier=i,
            availability='available'
        )
        database.session.add(spot)
    database.session.commit()
    return jsonify({'message': 'Parking lot created successfully with spots.'})

@admin_routes.route('/admin/lots/<int:lot_id>', methods=['PUT'])
def update_parking_lot(lot_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    lot = Lot.query.get(lot_id)
    if not lot:
        return jsonify({'error': 'Parking lot not found'}), 404
    data = request.get_json()
    lot.lot_name = data.get('lot_name', lot.lot_name)
    lot.lot_location = data.get('lot_location', lot.lot_location)
    lot.pincode = data.get('pincode', lot.pincode)
    lot.hourly_rate = data.get('hourly_rate', lot.hourly_rate)
    lot.total_spots = data.get('total_spots', lot.total_spots)
    database.session.commit()
    return jsonify({'message': 'Parking lot updated successfully.'})

@admin_routes.route('/admin/lots/<int:lot_id>', methods=['DELETE'])
def delete_parking_lot(lot_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    lot = Lot.query.get(lot_id)
    if not lot:
        return jsonify({'error': 'Parking lot not found'}), 404
    occupied_count = Spot.query.filter_by(lot_id=lot_id, availability='occupied').count()
    if occupied_count > 0:
        return jsonify({'error': 'Cannot delete. Some spots are still occupied.'}), 400
    database.session.delete(lot)
    database.session.commit()
    return jsonify({'message': 'Parking lot removed successfully.'})

@admin_routes.route('/admin/users', methods=['GET'])
def list_all_users():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    users = Account.query.filter(Account.role != 'admin').all()
    result = [
        {
            'account_id': user.account_id,
            'email_address': user.email_address,
            'full_name': user.full_name,
            'address': user.address,
            'postal_code': user.postal_code
        } for user in users
    ]
    return jsonify({'users': result})

@admin_routes.route('/admin/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    user = Account.query.get(user_id)
    if not user or user.role == 'admin':
        return jsonify({'error': 'User not found'}), 404
    return jsonify({
        'account_id': user.account_id,
        'email_address': user.email_address,
        'full_name': user.full_name,
        'address': user.address,
        'postal_code': user.postal_code,
        'role': user.role
    })

@admin_routes.route('/lots/search', methods=['GET'])
def search_lots():
    location = request.args.get('location', '').strip()
    pincode = request.args.get('pincode', '').strip()
    if not location and not pincode:
        return jsonify({'error': 'At least one of location or pincode is required'}), 400
    query = Lot.query
    if location:
        query = query.filter(Lot.lot_location.ilike(f'%{location}%'))
    if pincode:
        query = query.filter(Lot.pincode == pincode)
    lots = query.all()
    result = []
    for lot in lots:
        available_spots = sum(1 for spot in lot.spots if spot.availability == 'available')
        occupied_spots = sum(1 for spot in lot.spots if spot.availability == 'occupied')
        result.append({
            'lot_id': lot.lot_id,
            'lot_name': lot.lot_name,
            'lot_location': lot.lot_location,
            'pincode': lot.pincode,
            'hourly_rate': lot.hourly_rate,
            'total_spots': lot.total_spots,
            'available_spots': available_spots,
            'occupied_spots': occupied_spots
        })
    return jsonify({'lots': result})

@admin_routes.route('/admin/lots/<int:lot_id>/spots', methods=['GET'])
def view_spots_in_lot(lot_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    spots = Spot.query.filter_by(lot_id=lot_id).all()
    spot_data = []

    for spot in spots:
        info = {
            'spot_id': spot.spot_id,
            'identifier': spot.identifier,
            'availability': spot.availability
        }
        if spot.availability == 'occupied' and spot.active_reservation:
            reservation = Reservation.query.get(spot.active_reservation)
            if reservation:
                info['vehicle_details'] = {
                    'vehicle_number': reservation.vehicle_number,
                    'checkin_time': reservation.checkin_time,
                    'account_id': reservation.account_id
                }
        spot_data.append(info)
    return jsonify({'spots': spot_data})

@admin_routes.route('/admin/lots/<int:lot_id>/slots/<int:spot_id>/summary', methods=['GET'])
def admin_slot_summary(lot_id, spot_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    lot = Lot.query.get(lot_id)
    if not lot:
        return jsonify({'error': 'Lot not found'}), 404

    spot = Spot.query.get(spot_id)
    if not spot or spot.lot_id != lot_id:
        return jsonify({'error': 'Spot not found in this lot'}), 404
    if spot.availability != 'occupied' or not spot.active_reservation:
        return jsonify({'error': 'Spot is not currently occupied'}), 400

    reservation = Reservation.query.get(spot.active_reservation)
    if not reservation or reservation.reservation_status != 'active':
        return jsonify({'error': 'No active reservation for this spot'}), 400

    now_ist = datetime.now(IST)
    checkin = reservation.checkin_time.astimezone(IST)
    duration_hours = (now_ist - checkin).total_seconds() / 3600
    duration_hours_rounded = max(1, int(duration_hours + 0.999))
    amount_due = duration_hours_rounded * lot.hourly_rate

    return jsonify({
        'spot_id': spot.spot_id,
        'lot_id': lot.lot_id,
        'identifier': spot.identifier,
        'vehicle_number': reservation.vehicle_number,
        'checkin_time_ist': checkin.strftime('%Y-%m-%d %H:%M:%S'),
        'current_time_ist': now_ist.strftime('%Y-%m-%d %H:%M:%S'),
        'duration_hours': duration_hours_rounded,
        'hourly_rate': lot.hourly_rate,
        'amount_due': amount_due,
        'status': reservation.reservation_status
    })

@admin_routes.route('/admin/lots/<int:lot_id>/slots/<int:spot_id>', methods=['DELETE'])
def delete_slot_from_lot(lot_id, spot_id):
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403

    lot = Lot.query.get(lot_id)
    if not lot:
        return jsonify({'error': 'Lot not found'}), 404

    spot = Spot.query.get(spot_id)
    if not spot or spot.lot_id != lot_id:
        return jsonify({'error': 'Spot not found in this lot'}), 404
    if spot.availability == 'occupied':
        return jsonify({'error': 'Cannot delete: spot is currently occupied'}), 400

    database.session.delete(spot)
    lot.total_spots = max(0, lot.total_spots - 1)
    database.session.commit()
    return jsonify({'message': 'Spot deleted successfully and lot total_spots updated.'})

@admin_routes.route('/admin/summary/occupancy', methods=['GET'])
def admin_lot_occupancy_summary():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    lots = Lot.query.all()
    data = []
    for lot in lots:
        occupied = Spot.query.filter_by(lot_id=lot.lot_id, availability='occupied').count()
        available = Spot.query.filter_by(lot_id=lot.lot_id, availability='available').count()
        data.append({
            'lot_id': lot.lot_id,
            'lot_name': lot.lot_name,
            'occupied': occupied,
            'available': available
        })
    return jsonify({'occupancy': data})

@admin_routes.route('/admin/summary/revenue', methods=['GET'])
def admin_lot_revenue_summary():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    lots = Lot.query.all()
    data = []
    for lot in lots:
        reservations = Reservation.query.join(Spot, Reservation.spot_id == Spot.spot_id)\
            .filter(Spot.lot_id == lot.lot_id, Reservation.reservation_status == 'released').all()
        total_revenue = 0
        for r in reservations:
            if r.checkout_time and r.checkin_time:
                duration = (r.checkout_time - r.checkin_time).total_seconds() / 3600
                hours = max(1, int(duration + 0.999))
                total_revenue += hours * lot.hourly_rate
        data.append({
            'lot_id': lot.lot_id,
            'lot_name': lot.lot_name,
            'total_revenue': total_revenue
        })
    return jsonify({'revenue': data})
