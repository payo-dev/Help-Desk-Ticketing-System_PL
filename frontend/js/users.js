const API = 'http://127.0.0.1:3000';
let globalUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();
  loadRolesAndDepts();

  document.getElementById('userSearch').addEventListener('input', applyFilters);
  document.getElementById('roleFilter').addEventListener('change', applyFilters);
  document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
});

// ===================== LOAD ROLES & DEPARTMENTS DYNAMICALLY =====================
async function loadRolesAndDepts() {
  try {
    const [rolesRes, deptsRes] = await Promise.all([
      fetch(`${API}/api/users/roles`, { credentials: 'include' }),
      fetch(`${API}/api/users/departments`, { credentials: 'include' })
    ]);

    const roles = await rolesRes.json();
    const depts = await deptsRes.json();

    // Populate role dropdown in form
    const roleSelect = document.getElementById('uRole');
    roleSelect.innerHTML = roles.map(r =>
      `<option value="${r.id}">${r.name}</option>`
    ).join('');

    // Populate role filter dropdown
    const roleFilter = document.getElementById('roleFilter');
    roleFilter.innerHTML = `<option value="all">All Roles</option>` +
      roles.map(r => `<option value="${r.name}">${r.name}</option>`).join('');

    // Populate department dropdown in form
    const deptSelect = document.getElementById('uDepartment');
    deptSelect.innerHTML = `<option value="">— No Department —</option>` +
      depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  } catch (err) {
    console.error('Failed to load roles/departments:', err);
  }
}

// ===================== FETCH USERS =====================
async function fetchUsers() {
  try {
    const res = await fetch(`${API}/api/users`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';

    globalUsers = await res.json();
    renderUsers(globalUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
  }
}

// ===================== RENDER USERS =====================
function renderUsers(users) {
  const tbody = document.getElementById('users-tbody');

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No users found.</td></tr>`;
    return;
  }

  const roleColors = {
    'System Administrator':   'bg-red-50 text-red-600',
    'Employee':               'bg-blue-50 text-blue-600',
    'IT Specialist':          'bg-indigo-50 text-indigo-600',
    'HR Specialist':          'bg-pink-50 text-pink-600',
    'Finance Specialist':     'bg-green-50 text-green-600',
    'Facilities Specialist':  'bg-teal-50 text-teal-600',
    'Procurement Specialist': 'bg-cyan-50 text-cyan-600',
    'Specialist':             'bg-indigo-50 text-indigo-600',
    'Team Lead':              'bg-purple-50 text-purple-600',
    'Asset Manager':          'bg-orange-50 text-orange-600',
    'Department Manager':     'bg-yellow-50 text-yellow-700',
    'Executive':              'bg-gray-100 text-gray-700',
  };

  tbody.innerHTML = users.map(user => {
    const roleClass = roleColors[user.role] || 'bg-gray-100 text-gray-600';
    const initials = `${user.first_name?.[0] || '?'}${user.last_name?.[0] || '?'}`;
    const statusBadge = user.is_active
      ? `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#10b981]"></span><span class="text-sm font-medium text-gray-700">Active</span></span>`
      : `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-400"></span><span class="text-sm font-medium text-gray-500">Inactive</span></span>`;

    return `
      <tr class="hover:bg-gray-50 transition group">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
              ${initials}
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900">${user.first_name} ${user.last_name}</p>
              <p class="text-xs text-gray-500">${user.email}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold ${roleClass}">${user.role || 'Unknown'}</span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${user.department || '—'}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <button onclick="toggleUserStatus(${user.id}, ${user.is_active})"
              class="text-xs font-bold px-3 py-1.5 rounded-lg transition ${user.is_active
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-green-50 text-[#10b981] hover:bg-green-100'}">
              ${user.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ===================== FILTERS =====================
function applyFilters() {
  const search = document.getElementById('userSearch').value.toLowerCase();
  const role = document.getElementById('roleFilter').value;

  const filtered = globalUsers.filter(u => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(search) || u.email.toLowerCase().includes(search);
    const matchesRole = role === 'all' || (u.role && u.role === role);
    return matchesSearch && matchesRole;
  });

  renderUsers(filtered);
}

// ===================== ADD USER =====================
async function handleAddUser(e) {
  e.preventDefault();

  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Creating...';
  btn.disabled = true;

  const deptVal = document.getElementById('uDepartment').value;
  const empId = `EMP-${Date.now().toString().slice(-5)}`;

  const data = {
    employee_id: empId,
    first_name: document.getElementById('uFirstName').value.trim(),
    last_name:  document.getElementById('uLastName').value.trim(),
    email:      document.getElementById('uEmail').value.trim(),
    password:   document.getElementById('uPassword').value,
    role_id:    parseInt(document.getElementById('uRole').value),
    department_id: deptVal ? parseInt(deptVal) : null
  };

  try {
    const res = await fetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    if (res.ok) {
      toggleUserModal(false);
      fetchUsers();
      showToast('User created successfully!');
    } else {
      const err = await res.json();
      alert(`Error: ${err.message || 'Failed to create user'}`);
    }
  } catch (err) {
    console.error('Failed to submit:', err);
    alert('Server connection error.');
  } finally {
    btn.textContent = 'Create User';
    btn.disabled = false;
  }
}

// ===================== TOGGLE USER STATUS =====================
async function toggleUserStatus(userId, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const res = await fetch(`${API}/api/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: !currentStatus })
    });

    if (res.ok) {
      fetchUsers();
    } else {
      alert('Failed to update user status.');
    }
  } catch (err) {
    console.error(err);
  }
}

// ===================== MODAL =====================
function toggleUserModal(show) {
  const modal = document.getElementById('addUserModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
  if (!show) document.getElementById('addUserForm').reset();
}

// ===================== TOAST =====================
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-6 right-6 bg-[#10b981] text-white px-6 py-4 rounded-2xl shadow-xl text-sm font-bold z-50 flex items-center gap-2';
  toast.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// Close modal on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('addUserModal')) toggleUserModal(false);
};