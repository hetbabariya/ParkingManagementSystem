// admin.js - Admin Dashboard Logic
// Assumes window.api is available

document.addEventListener('DOMContentLoaded', async function () {
  try {
    await window.api.getUsers();
  } catch (err) {
    window.location.href = 'index.html?session=expired';
    return;
  }
  // Elements
  const lotsContainer = document.getElementById('lot-cards');
  const alertContainer = document.getElementById('admin-alerts');
  const addLotForm = document.getElementById('add-lot-form');
  const editLotForm = document.getElementById('edit-lot-form');
  const usersTable = document.getElementById('users-table-body');
  const logoutBtn = document.getElementById('logout-btn');

  // Utility
  function showAlert(msg, type = 'success') {
    if (!alertContainer) return;
    alertContainer.innerHTML = `<div class='alert alert-${type} alert-dismissible fade show' role='alert'>${msg}<button type='button' class='btn-close' data-bs-dismiss='alert'></button></div>`;
  }

  // Reusable function to render a lot card (for Home and Search)
  function renderLotCard(lot) {
    return `
      <div class="col-md-4 mb-3">
        <div class="card">
          <div class="card-header">${lot.lot_name}</div>
          <div class="card-body">
            <p>Location: ${lot.lot_location}</p>
            <p>Pin: ${lot.pincode}</p>
            <span class="badge bg-success">Available: ${lot.available_spots}</span>
            <span class="badge bg-danger">Occupied: ${lot.occupied_spots}</span>
            <div class="mt-2">
              <button class="btn btn-primary btn-sm edit-lot-btn" data-id="${lot.lot_id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-lot-btn" data-id="${lot.lot_id}">Delete</button>
              <button class="btn btn-secondary btn-sm view-spots-btn" data-id="${lot.lot_id}">Spots</button>
            </div>
            <div class="spot-grid mt-3 d-flex flex-wrap gap-2" style="display:none;"></div>
          </div>
        </div>
      </div>`;
  }

  // Load Lots
  async function loadLots() {
    if (!lotsContainer) return;
    lotsContainer.innerHTML = '<div class="text-muted">Loading lots...</div>';
    try {
      const data = await window.api.getLots();
      lotsContainer.innerHTML = '';
      data.lots.forEach(lot => {
        lotsContainer.innerHTML += renderLotCard(lot);
      });
    } catch (err) {
      lotsContainer.innerHTML = `<div class='text-danger'>${err}</div>`;
    }
  }

  // Add Lot
  if (addLotForm) {
    addLotForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const lot = {
        lot_name: addLotForm['lot_name'].value,
        lot_location: addLotForm['lot_location'].value,
        pincode: addLotForm['pincode'].value,
        hourly_rate: addLotForm['hourly_rate'].value,
        total_spots: addLotForm['total_spots'].value
      };
      try {
        await window.api.addLot(lot);
        showAlert('Lot added successfully.');
        addLotForm.reset();
        loadLots();
        bootstrap.Modal.getInstance(document.getElementById('addLotModal')).hide();
      } catch (err) {
        showAlert(err, 'danger');
      }
    });
  }

  // Edit Lot (open modal)
  document.body.addEventListener('click', async function (e) {
    if (e.target.classList.contains('edit-lot-btn')) {
      const lotId = e.target.getAttribute('data-id');
      try {
        const data = await window.api.getLots();
        const lot = data.lots.find(l => l.lot_id == lotId);
        if (lot && editLotForm) {
          editLotForm['edit_lot_id'].value = lot.lot_id;
          editLotForm['edit_lot_name'].value = lot.lot_name;
          editLotForm['edit_lot_location'].value = lot.lot_location;
          editLotForm['edit_pincode'].value = lot.pincode;
          editLotForm['edit_hourly_rate'].value = lot.hourly_rate;
          editLotForm['edit_total_spots'].value = lot.total_spots;
          new bootstrap.Modal(document.getElementById('editLotModal')).show();
        }
      } catch (err) {
        showAlert(err, 'danger');
      }
    }
  });

  // Edit Lot (submit)
  if (editLotForm) {
    editLotForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const lotId = editLotForm['edit_lot_id'].value;
      const lot = {
        lot_name: editLotForm['edit_lot_name'].value,
        lot_location: editLotForm['edit_lot_location'].value,
        pincode: editLotForm['edit_pincode'].value,
        hourly_rate: editLotForm['edit_hourly_rate'].value,
        total_spots: editLotForm['edit_total_spots'].value
      };
      try {
        await window.api.editLot(lotId, lot);
        showAlert('Lot updated successfully.');
        loadLots();
        bootstrap.Modal.getInstance(document.getElementById('editLotModal')).hide();
      } catch (err) {
        showAlert(err, 'danger');
      }
    });
  }

  // Delete Lot
  document.body.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-lot-btn')) {
      const lotId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this lot?')) {
        try {
          await window.api.deleteLot(lotId);
          showAlert('Lot deleted successfully.');
          loadLots();
        } catch (err) {
          showAlert(err, 'danger');
        }
      }
    }
  });

  // View Spots (show in alert for simplicity)
  document.body.addEventListener('click', async function (e) {
    if (e.target.classList.contains('view-spots-btn')) {
      // Remove the alert/modal display for spots
      // (No action needed now)
    }
  });

  // Load Users
  async function loadUsers() {
    if (!usersTable) return;
    usersTable.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      const data = await window.api.getUsers();
      usersTable.innerHTML = '';
      data.users.forEach(u => {
        usersTable.innerHTML += `<tr><td>${u.account_id}</td><td>${u.email_address}</td><td>${u.full_name}</td><td>${u.address}</td><td>${u.postal_code}</td></tr>`;
      });
    } catch (err) {
      usersTable.innerHTML = `<tr><td colspan="5" class='text-danger'>${err}</td></tr>`;
    }
  }

  // --- Spot Display ---
  // Add spot boxes below each lot card
  lotsContainer.addEventListener('click', async function (e) {
    if (e.target.classList.contains('view-spots-btn')) {
      const lotId = e.target.getAttribute('data-id');
      try {
        const data = await window.api.getLotSpots(lotId);
        // Show spots as boxes below the lot card
        const lotCard = e.target.closest('.card');
        let spotGrid = lotCard.querySelector('.spot-grid');
        if (!spotGrid) {
          spotGrid = document.createElement('div');
          spotGrid.className = 'spot-grid mt-3 d-flex flex-wrap gap-2';
          lotCard.appendChild(spotGrid);
        }
        spotGrid.innerHTML = '';
        data.spots.forEach(spot => {
          const box = document.createElement('button');
          box.className = `spot-box btn btn-sm d-flex flex-column align-items-center justify-content-center ${spot.availability === 'available' ? 'btn-outline-success' : 'btn-outline-danger'}`;
          box.innerHTML = `<span style='font-weight:bold;'>${spot.identifier}</span><span style='font-size:0.8em;'>${spot.availability === 'available' ? 'A' : 'O'}</span>`;
          box.title = `Spot #${spot.identifier}`;
          box.setAttribute('data-lot-id', lotId);
          box.setAttribute('data-spot-id', spot.spot_id);
          box.setAttribute('data-identifier', spot.identifier);
          spotGrid.appendChild(box);
        });
      } catch (err) {
        showAlert(err, 'danger');
      }
    }
  });

  // Spot box click: show info modal
  lotsContainer.addEventListener('click', async function (e) {
    if (e.target.classList.contains('spot-box')) {
      const lotId = e.target.getAttribute('data-lot-id');
      const spotId = e.target.getAttribute('data-spot-id');
      const identifier = e.target.getAttribute('data-identifier');
      const modalBody = document.getElementById('spot-modal-body');
      const deleteBtn = document.getElementById('delete-spot-btn');
      try {
        const info = await window.api.getSpotSummary(lotId, spotId);
        modalBody.innerHTML = `<b>Spot #${identifier}</b><br>Vehicle: ${info.vehicle_number || '-'}<br>Status: ${info.status || '-'}<br>Duration: ${info.duration_hours || '-'} hr<br>Amount Due: ₹${info.amount_due || '-'}<br>`;
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = async function () {
          if (confirm('Delete this spot?')) {
            try {
              await window.api.deleteSpot(lotId, spotId);
              showAlert('Spot deleted.');
              bootstrap.Modal.getInstance(document.getElementById('spotModal')).hide();
              loadLots();
            } catch (err) {
              showAlert(err, 'danger');
            }
          }
        };
      } catch (err) {
        // If not occupied, show basic info and allow delete
        modalBody.innerHTML = `<b>Spot #${identifier}</b><br>Status: Available`;
        deleteBtn.style.display = 'inline-block';
        deleteBtn.onclick = async function () {
          if (confirm('Delete this spot?')) {
            try {
              await window.api.deleteSpot(lotId, spotId);
              showAlert('Spot deleted.');
              bootstrap.Modal.getInstance(document.getElementById('spotModal')).hide();
              loadLots();
            } catch (err) {
              showAlert(err, 'danger');
            }
          }
        };
      }
      new bootstrap.Modal(document.getElementById('spotModal')).show();
    }
  });

  // Load on page ready
  loadLots();
  loadUsers();

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      try {
        await window.api.logout();
        sessionStorage.clear();
        window.location.href = 'index.html';
      } catch (err) {
        showAlert(err, 'danger');
      }
    });
  }

  // Menu switching
  const sectionHome = document.getElementById('section-home');
  const sectionUsers = document.getElementById('section-users');
  const sectionSearch = document.getElementById('section-search');
  const sectionSummary = document.getElementById('section-summary');
  function showSection(section) {
    sectionHome.style.display = 'none';
    sectionUsers.style.display = 'none';
    sectionSearch.style.display = 'none';
    sectionSummary.style.display = 'none';
    section.style.display = '';
  }
  document.getElementById('menu-home').onclick = function() { showSection(sectionHome); };
  document.getElementById('menu-users').onclick = function() { showSection(sectionUsers); };
  document.getElementById('menu-search').onclick = function() { showSection(sectionSearch); };
  document.getElementById('menu-summary').onclick = function() { showSection(sectionSummary); loadSummaryCharts(); };
  document.getElementById('menu-logout').onclick = async function() {
    try {
      await window.api.logout();
      sessionStorage.clear();
      window.location.href = 'index.html';
    } catch (err) {
      showAlert(err, 'danger');
    }
  };
  // Search logic
  document.getElementById('search-form').onsubmit = async function(e) {
    e.preventDefault();
    const type = document.getElementById('search-type').value;
    const value = document.getElementById('search-string').value.trim();
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '<div>Searching...</div>';
    if (type === 'user_id') {
      try {
        const user = await window.api.getUser(value);
        resultsDiv.innerHTML = `<div class='card'><div class='card-header'>User #${user.account_id}</div><div class='card-body'><b>Name:</b> ${user.full_name || '-'}<br><b>Email:</b> ${user.email_address || '-'}<br><b>Address:</b> ${user.address || '-'}<br><b>Pin Code:</b> ${user.postal_code || '-'}<br><b>Role:</b> ${user.role || '-'}</div></div>`;
      } catch (err) {
        resultsDiv.innerHTML = `<div class='text-danger'>${err}</div>`;
      }
    } else {
      let params = {};
      if (type === 'location') params['location'] = value;
      if (type === 'pincode') params['pincode'] = value;
      try {
        const data = await window.api.searchLots(params);
        if (data.lots && data.lots.length > 0) {
          resultsDiv.innerHTML = '<div class="row">' + data.lots.map(lot => {
            // Patch: if available_spots/occupied_spots missing, use total_spots and 0
            if (lot.available_spots === undefined && lot.occupied_spots === undefined) {
              lot.available_spots = lot.total_spots !== undefined ? lot.total_spots : 0;
              lot.occupied_spots = 0;
            }
            return renderLotCard(lot);
          }).join('') + '</div>';
        } else {
          resultsDiv.innerHTML = '<div>No results found.</div>';
        }
      } catch (err) {
        resultsDiv.innerHTML = `<div class='text-danger'>${err}</div>`;
      }
    }
  };
  // Summary charts
  async function loadSummaryCharts() {
    if (!window.Chart) return;
    // Revenue chart
    try {
      const rev = await window.api.getRevenue();
      const ctx1 = document.getElementById('revenue-chart').getContext('2d');
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: rev.revenue.map(r => r.lot_name),
          datasets: [{ data: rev.revenue.map(r => r.total_revenue), backgroundColor: ['#4caf50','#2196f3','#ff9800','#e91e63','#9c27b0'] }]
        },
        options: { plugins: { legend: { display: true } } }
      });
    } catch {}
    // Occupancy chart
    try {
      const occ = await window.api.getOccupancy();
      const ctx2 = document.getElementById('occupancy-chart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: occ.occupancy.map(o => o.lot_name),
          datasets: [
            { label: 'Available', data: occ.occupancy.map(o => o.available), backgroundColor: '#4caf50' },
            { label: 'Occupied', data: occ.occupancy.map(o => o.occupied), backgroundColor: '#e74c3c' }
          ]
        },
        options: { plugins: { legend: { display: true } }, responsive: true }
      });
    } catch {}
  }
}); 