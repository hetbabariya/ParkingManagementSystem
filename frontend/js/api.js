// Minimal API utility for Vehicle Parking System
const API_BASE = 'http://127.0.0.1:5000';

function apiFetch(endpoint, options = {}) {
  return fetch(API_BASE + endpoint, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw data.error || 'Request failed';
      return data;
    });
}

window.api = {
  // Auth
  login(email, password) {
    return apiFetch('/auth/signin', {
      method: 'POST',
      credentials: "include",
      body: JSON.stringify({ email_address: email, user_password: password })
    });
  },
  register(user) {
    // If backend expects user_password instead of password
    return apiFetch('/auth/signup', {
      method: 'POST',
      credentials: "include",
      body: JSON.stringify({
        email_address: user.email_address,
        user_password: user.password,
        full_name: user.full_name,
        address: user.address,
        postal_code: user.postal_code
      })
    });
  },
  logout() {
    // Use the correct endpoint and method for signout
    return apiFetch('/auth/signout', { method: 'POST' });
  },
  // Admin Lots
  getLots() { return apiFetch('/admin/lots'); },
  addLot(lot) {
    return apiFetch('/admin/lots', { method: 'POST', body: JSON.stringify(lot) });
  },
  editLot(lot_id, lot) {
    return apiFetch(`/admin/lots/${lot_id}`, { method: 'PUT', body: JSON.stringify(lot) });
  },
  deleteLot(lot_id) {
    return apiFetch(`/admin/lots/${lot_id}`, { method: 'DELETE' });
  },
  getLotSpots(lot_id) {
    return apiFetch(`/admin/lots/${lot_id}/spots`);
  },
  deleteSpot(lot_id, spot_id) {
    return apiFetch(`/admin/lots/${lot_id}/slots/${spot_id}`, { method: 'DELETE' });
  },
  getSpotSummary(lot_id, spot_id) {
    return apiFetch(`/admin/lots/${lot_id}/slots/${spot_id}/summary`);
  },
  // Admin Users
  getUsers() { return apiFetch('/admin/users'); },
  getUser(user_id) { return apiFetch(`/admin/users/${user_id}`); },
  // Admin Summaries
  getOccupancy() { return apiFetch('/admin/summary/occupancy'); },
  getRevenue() { return apiFetch('/admin/summary/revenue'); },
  // User
  getUserLots() { return apiFetch('/user/lots'); },
  bookSpot(lot_id, vehicle_number) {
    return apiFetch(`/user/lots/${lot_id}/book`, {
      method: 'POST',
      body: JSON.stringify({ vehicle_number })
    });
  },
  getReleaseSummary(reservation_id) {
    return apiFetch(`/user/reservations/${reservation_id}/release-summary`);
  },
  releaseSpot(reservation_id) {
    return apiFetch(`/user/reservations/${reservation_id}/release`, { method: 'POST' });
  },
  getHistory() { return apiFetch('/user/history'); },
  getUserSummary() { return apiFetch('/user/summary'); },
  searchLots(params) {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/lots/search?${q}`);
  }
}; 