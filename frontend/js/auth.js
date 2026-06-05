const API = 'http://127.0.0.1:3000';

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('error-msg');

  errorMsg.classList.add('hidden');

  if (!email || !password) {
    errorMsg.textContent = 'Please enter your email and password.';
    errorMsg.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Save user info
      localStorage.setItem('user', JSON.stringify(data.user));
      // Redirect based on role
      redirectByRole(data.user.role);
    } else {
      errorMsg.textContent = data.message || 'Login failed.';
      errorMsg.classList.remove('hidden');
    }

  } catch (err) {
    errorMsg.textContent = 'Cannot connect to server.';
    errorMsg.classList.remove('hidden');
  }
});

function redirectByRole(role) {
  switch (role) {
    case 'System Administrator':
    case 'Help Desk Agent':
    case 'Team Lead':
      window.location.href = 'dashboard-helpdesk.html';
      break;
    case 'Asset Manager':
      window.location.href = 'dashboard-assets.html';
      break;
    case 'Executive':
      window.location.href = 'dashboard-executive.html';
      break;
    default:
      window.location.href = 'dashboard-helpdesk.html';
  }
}