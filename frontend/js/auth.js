const API = 'http://127.0.0.1:3000';

const loginForm = document.getElementById('login-form');
const loginHandler = async () => {
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
};

// Support both form submit (Enter key) and button click
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginHandler();
  });
} else {
  document.getElementById('login-btn').addEventListener('click', loginHandler);
}

function redirectByRole(role) {
  // Convert role to string just in case, to prevent errors
  const userRole = role ? role.toString() : '';

  switch (userRole) {
    case 'System Administrator':
    case 'Admin':
    case 'Help Desk Agent':
    case 'Team Lead':
      window.location.href = 'dashboard-helpdesk.html';
      break;
      
    // Route all department specialists to the specialist dashboard
    case 'IT Specialist':
    case 'HR Specialist':
    case 'Finance Specialist':
    case 'Facilities Specialist':
    case 'Procurement Specialist':
      window.location.href = 'specialist-dashboard.html';
      break;
      
    case 'Employee':
      window.location.href = 'employee-tickets.html';
      break;

    case 'Asset Manager':
      window.location.href = 'dashboard-assets.html';
      break;

    case 'Executive':
      window.location.href = 'dashboard-executive.html';
      break;

    default:
      // If the role is missing or unknown, send them back to login for security
      alert(`Role not recognized: [${userRole}]. Please contact support.`);
      window.location.href = 'login.html';
  }
}