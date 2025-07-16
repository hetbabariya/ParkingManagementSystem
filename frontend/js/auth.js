// auth.js for login and register pages
// Assumes api.js is loaded before this script and exposes window.api

document.addEventListener('DOMContentLoaded', function () {
  // Login page logic
  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const alertContainer = document.getElementById('alert-container');
      alertContainer.innerHTML = '';
      try {
        const res = await window.api.login(email, password);
        sessionStorage.setItem('is_logged_in', 'true');
        sessionStorage.setItem('role', res.role);
        if (res.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'user-dashboard.html';
        }
      } catch (err) {
        alertContainer.innerHTML = `<div class='alert alert-danger'>${err}</div>`;
      }
    });
  }

  // Register page logic
  if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = {
        full_name: document.getElementById('register-name').value,
        email_address: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        address: document.getElementById('register-address').value,
        postal_code: document.getElementById('register-pin').value
      };
      const alertContainer = document.getElementById('alert-container');
      const registerBtn = document.querySelector('#register-form button[type="submit"]');
      alertContainer.innerHTML = '';
      registerBtn.disabled = true;
      try {
        await window.api.register(user);
        // Redirect to login page with success message
        window.location.href = 'index.html?signup=success';
      } catch (err) {
        alertContainer.innerHTML = `<div class='alert alert-danger'>${err}</div>`;
        registerBtn.disabled = false;
      }
    });
  }
}); 