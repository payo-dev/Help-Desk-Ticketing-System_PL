const API = 'http://127.0.0.1:3000';
let globalUsers = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    // Event listeners for searching and filtering
    document.getElementById('userSearch').addEventListener('input', applyFilters);
    document.getElementById('roleFilter').addEventListener('change', applyFilters);

    // Form submission
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
});

async function fetchUsers() {
    try {
        const res = await fetch(`${API}/api/users`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';

        globalUsers = await res.json();
        renderUsers(globalUsers);
    } catch (err) {
        console.error("Error fetching users:", err);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('users-tbody');
    
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">No users found.</td></tr>`;
        return;
    }

    tbody.innerHTML = users.map(user => {
        // Determine badge color based on role
        let roleBadge = `<span class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">${user.role || 'Unknown'}</span>`;
        if (user.role === 'Admin') roleBadge = `<span class="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">${user.role}</span>`;
        if (user.role === 'IT Specialist' || user.role === 'Support') roleBadge = `<span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">${user.role}</span>`;

        // Active vs Inactive Status
        const statusBadge = user.is_active 
            ? `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-[#10b981]"></span><span class="text-sm font-medium text-gray-700">Active</span></span>`
            : `<span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="text-sm font-medium text-gray-700">Inactive</span></span>`;

        return `
            <tr class="hover:bg-gray-50 transition group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                            ${user.first_name[0]}${user.last_name[0]}
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition">${user.first_name} ${user.last_name}</p>
                            <p class="text-xs text-gray-500">${user.email}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${roleBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${user.department || 'Unassigned'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function applyFilters() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;

    const filtered = globalUsers.filter(u => {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        const matchesSearch = fullName.includes(search) || u.email.toLowerCase().includes(search);
        
        // Handle missing roles safely
        const userRole = u.role ? u.role : '';
        const matchesRole = (role === 'all' || userRole === role);
        
        return matchesSearch && matchesRole;
    });

    renderUsers(filtered);
}

function toggleUserModal(show) {
    const modal = document.getElementById('addUserModal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
        document.getElementById('addUserForm').reset();
    }
}

async function handleAddUser(e) {
    e.preventDefault();

    const data = {
        first_name: document.getElementById('uFirstName').value,
        last_name: document.getElementById('uLastName').value,
        email: document.getElementById('uEmail').value,
        password: document.getElementById('uPassword').value,
        role_id: parseInt(document.getElementById('uRole').value),
        department_id: parseInt(document.getElementById('uDepartment').value)
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
            fetchUsers(); // Refresh the table
        } else {
            const err = await res.json();
            alert(`Error: ${err.error || 'Failed to create user'}`);
        }
    } catch (error) {
        console.error("Failed to submit:", error);
    }
}