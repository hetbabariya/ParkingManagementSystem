// user.js - User Dashboard Logic (Full Feature Implementation)
document.addEventListener('DOMContentLoaded', async function () {
  try {
    await window.api.getHistory();
  } catch (err) {
    window.location.href = 'index.html?session=expired';
    return;
  }
  // Section elements
  const sectionHome = document.getElementById('section-home');
  const sectionSummary = document.getElementById('section-summary');
  // Navbar
  const menuHome = document.getElementById('menu-home');
  const menuSummary = document.getElementById('menu-summary');
  const menuLogout = document.getElementById('menu-logout');
  if (menuHome) menuHome.onclick = function() { showSection(sectionHome); };
  if (menuSummary) menuSummary.onclick = function() { showSection(sectionSummary); loadSummary(); };
  if (menuLogout) menuLogout.onclick = async function() {
    try { await window.api.logout(); sessionStorage.clear(); window.location.href = 'index.html'; } catch (err) { showAlert(err, 'danger'); }
  };
  // Remove edit-profile-btn and modal logic
  function showSection(section) {
    sectionHome.style.display = 'none';
    sectionSummary.style.display = 'none';
    section.style.display = '';
  }
  // Alert
  const alertContainer = document.getElementById('user-alerts');
  function showAlert(msg, type = 'success') {
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class='alert alert-${type} alert-dismissible fade show' role='alert'>${msg}<button type='button' class='btn-close' data-bs-dismiss='alert'></button></div>`;
  }
  // --- Parking History ---
  async function loadHistory() {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    try {
      const data = await window.api.getHistory();
      tbody.innerHTML = '';
      (data.history || []).forEach(h => {
        let action = '';
        if (h.status === 'active') {
          action = `<button class='btn btn-warning btn-sm release-btn' data-id='${h.reservation_id}'>Release</button>`;
        } else {
          action = `<span class='badge bg-success'>Parked Out</span>`;
        }
        tbody.innerHTML += `<tr>
          <td>${h.reservation_id}</td>
          <td>${h.spot_id || ''}</td>
          <td>${h.vehicle_number || ''}</td>
          <td>${h.checkin_time_ist || ''}</td>
          <td>${h.checkout_time_ist || ''}</td>
          <td>${action}</td>
        </tr>`;
      });
      if (!data.history || data.history.length === 0) tbody.innerHTML = '<tr><td colspan="6">No history found.</td></tr>';
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class='text-danger'>${err}</td></tr>`;
    }
  }
  // --- Search Lots ---
  document.getElementById('search-lots-form').onsubmit = async function(e) {
    e.preventDefault();
    const q = document.getElementById('search-lots-input').value.trim();
    const resultsTbody = document.getElementById('lots-search-results');
    resultsTbody.innerHTML = '<tr><td colspan="8">Searching...</td></tr>';
    let params = {};
    if (/^\d{4,}$/.test(q)) params.pincode = q; else params.location = q;
    try {
      const data = await window.api.searchLots(params);
      resultsTbody.innerHTML = '';
      (data.lots || []).forEach(lot => {
        resultsTbody.innerHTML += `<tr>
          <td>${lot.lot_id}</td>
          <td>${lot.lot_name || ''}</td>
          <td>${lot.lot_location || ''}</td>
          <td>${lot.pincode || ''}</td>
          <td>${lot.hourly_rate !== undefined ? lot.hourly_rate : ''}</td>
          <td>${lot.total_spots !== undefined ? lot.total_spots : ''}</td>
          <td><button class='btn btn-primary btn-sm book-btn' data-lot='${encodeURIComponent(JSON.stringify(lot))}'>Book</button></td>
        </tr>`;
      });
      if (!data.lots || data.lots.length === 0) resultsTbody.innerHTML = '<tr><td colspan="8">No results found.</td></tr>';
    } catch (err) {
      resultsTbody.innerHTML = `<tr><td colspan="8" class='text-danger'>${err}</td></tr>`;
    }
  };
  // --- Book Modal Logic ---
  let currentUserId = null;
  async function getUserId() {
    // Try to get from session or profile (simulate for now)
    if (currentUserId) return currentUserId;
    // Optionally fetch from /user/profile if available
    // For now, fallback to sessionStorage or prompt
    currentUserId = sessionStorage.getItem('user_id') || '';
    return currentUserId;
  }
  document.getElementById('lots-search-results').onclick = async function(e) {
    if (e.target.classList.contains('book-btn')) {
      const lot = JSON.parse(decodeURIComponent(e.target.getAttribute('data-lot')));
      document.getElementById('book-lot-id').value = lot.lot_id || '';
      document.getElementById('book-user-id').value = await getUserId();
      document.getElementById('book-vehicle-number').value = '';
      // Only show user-friendly fields: Lot Name, Location, Pincode, Hourly Rate, Total Spots (readonly), Vehicle Number (editable)
      let extraFields = '';
      extraFields += `<div class='mb-2'><label class='form-label'>Lot Name</label><input type='text' class='form-control' value='${lot.lot_name || ''}' readonly></div>`;
      extraFields += `<div class='mb-2'><label class='form-label'>Location</label><input type='text' class='form-control' value='${lot.lot_location || ''}' readonly></div>`;
      extraFields += `<div class='mb-2'><label class='form-label'>Pincode</label><input type='text' class='form-control' value='${lot.pincode || ''}' readonly></div>`;
      extraFields += `<div class='mb-2'><label class='form-label'>Hourly Rate</label><input type='text' class='form-control' value='${lot.hourly_rate !== undefined ? lot.hourly_rate : ''}' readonly></div>`;
      extraFields += `<div class='mb-2'><label class='form-label'>Total Spots</label><input type='text' class='form-control' value='${lot.total_spots !== undefined ? lot.total_spots : ''}' readonly></div>`;
      const modalBody = document.querySelector('#bookModal .modal-body');
      document.getElementById('book-lot-id').parentElement.style.display = 'none';
      document.getElementById('book-user-id').parentElement.style.display = 'none';
      document.getElementById('book-vehicle-number').parentElement.style.display = '';
      modalBody.querySelectorAll('.extra-book-field').forEach(el => el.remove());
      modalBody.insertAdjacentHTML('beforeend', `<div class='extra-book-field'>${extraFields}</div>`);
      new bootstrap.Modal(document.getElementById('bookModal')).show();
    }
  };
  document.getElementById('book-spot-form').onsubmit = async function(e) {
    e.preventDefault();
    const lotId = document.getElementById('book-lot-id').value;
    const vehicleNumber = document.getElementById('book-vehicle-number').value;
    try {
      await window.api.bookSpot(lotId, vehicleNumber);
      showAlert('Spot booked successfully.');
      bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
      loadHistory();
    } catch (err) {
      showAlert(err, 'danger');
    }
  };
  // --- Release Modal Logic ---
  document.getElementById('history-table-body').onclick = async function(e) {
    if (e.target.classList.contains('release-btn')) {
      const reservationId = e.target.getAttribute('data-id');
      try {
        const data = await window.api.getReleaseSummary(reservationId);
        document.getElementById('release-spot-id').value = data.spot_id || '';
        document.getElementById('release-parking-time').value = data.checkin_time_ist || '';
        document.getElementById('release-releasing-time').value = data.current_time_ist || '';
        document.getElementById('release-total-cost').value = data.amount_due || '';
        // Add extra fields for duration, hourly rate, status, reservation id
        let extraFields = '';
        extraFields += `<div class='mb-2'><label class='form-label'>Duration (hours)</label><input type='text' class='form-control' value='${data.duration_hours || ''}' disabled></div>`;
        extraFields += `<div class='mb-2'><label class='form-label'>Hourly Rate</label><input type='text' class='form-control' value='${data.hourly_rate || ''}' disabled></div>`;
        extraFields += `<div class='mb-2'><label class='form-label'>Reservation ID</label><input type='text' class='form-control' value='${data.reservation_id || ''}' disabled></div>`;
        extraFields += `<div class='mb-2'><label class='form-label'>Status</label><input type='text' class='form-control' value='${data.status || ''}' disabled></div>`;
        // Insert extra fields after releasing time
        const modalBody = document.querySelector('#releaseModal .modal-body');
        modalBody.querySelectorAll('.extra-release-field').forEach(el => el.remove());
        modalBody.insertAdjacentHTML('beforeend', `<div class='extra-release-field'>${extraFields}</div>`);
        // Disable all inputs for view-only
        modalBody.querySelectorAll('input').forEach(inp => inp.setAttribute('disabled', 'disabled'));
        document.getElementById('release-spot-form').setAttribute('data-id', reservationId);
        new bootstrap.Modal(document.getElementById('releaseModal')).show();
      } catch (err) {
        showAlert(err, 'danger');
      }
    }
  };
  document.getElementById('release-spot-form').onsubmit = async function(e) {
    e.preventDefault();
    const reservationId = e.target.getAttribute('data-id');
    try {
      await window.api.releaseSpot(reservationId);
      showAlert('Spot released successfully.');
      bootstrap.Modal.getInstance(document.getElementById('releaseModal')).hide();
      loadHistory();
    } catch (err) {
      showAlert(err, 'danger');
    }
  };
  // --- Summary Chart/Stats ---
  async function loadSummary() {
    const container = document.getElementById('user-summary-content');
    container.innerHTML = 'Loading...';
    try {
      const data = await window.api.getUserSummary();
      // Show total bookings and total paid
      let html = `<div class='mb-3'><b>Total Bookings:</b> ${data.total_bookings || 0} &nbsp; <b>Total Amount:</b> ₹${data.total_paid || 0}</div>`;
      html += `<canvas id='user-summary-chart' height='120'></canvas>`;
      container.innerHTML = html;
      if (window.Chart && data.lots) {
        const lotNames = Object.keys(data.lots);
        const bookings = lotNames.map(lot => data.lots[lot].bookings);
        const amounts = lotNames.map(lot => data.lots[lot].amount_paid);
        new Chart(document.getElementById('user-summary-chart').getContext('2d'), {
          type: 'bar',
          data: {
            labels: lotNames,
            datasets: [
              { label: 'Bookings', data: bookings, backgroundColor: '#2196f3' },
              { label: 'Amount Paid', data: amounts, backgroundColor: '#4caf50' }
            ]
          },
          options: { plugins: { legend: { display: true } }, responsive: true }
        });
      }
    } catch (err) {
      container.innerHTML = `<div class='text-danger'>${err}</div>`;
    }
  }
  // --- Initial Load ---
  showSection(sectionHome);
  loadHistory();
}); 