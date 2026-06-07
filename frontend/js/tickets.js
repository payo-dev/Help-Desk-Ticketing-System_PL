const API = 'http://127.0.0.1:3000';
let globalTickets = [];
let currentTicketId = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchTickets();
  loadSpecialists();

  const searchInput = document.querySelector('input[placeholder="Search by ID or Title..."]');
  const statusFilter = document.getElementById('statusFilter') || document.querySelector('select');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
});

// ===================== FETCH TICKETS =====================
async function fetchTickets() {
  const tbody = document.getElementById('tickets-table-body');
  try {
    const res = await fetch(`${API}/api/tickets`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    globalTickets = await res.json();

    if (!Array.isArray(globalTickets) || globalTickets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No tickets found.</td></tr>`;
      return;
    }

    applyFilters();
  } catch (err) {
    console.error('Error loading tickets:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Failed to load tickets.</td></tr>`;
  }
}

// ===================== LOAD SPECIALISTS =====================
async function loadSpecialists() {
  try {
    const res = await fetch(`${API}/api/users/specialists`, { credentials: 'include' });
    if (!res.ok) return;
    const specialists = await res.json();

    const select = document.getElementById('detail-assign-select');
    if (!select) return;

    specialists.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.first_name} ${s.last_name} (${s.role})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load specialists:', err);
  }
}

// ===================== RENDER TABLE =====================
function renderTable(ticketsToRender) {
  const tbody = document.getElementById('tickets-table-body');

  if (ticketsToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No matching tickets found.</td></tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };
  const statusColors = {
    Submitted:      'bg-blue-50 text-blue-600',
    Reviewed:       'bg-purple-50 text-purple-600',
    Assigned:       'bg-indigo-50 text-indigo-600',
    'In Progress':  'bg-yellow-50 text-yellow-600',
    'Pending User': 'bg-orange-50 text-orange-600',
    Resolved:       'bg-green-50 text-[#10b981]',
    Closed:         'bg-gray-100 text-gray-500'
  };

  tbody.innerHTML = ticketsToRender.map(t => `
    <tr class="hover:bg-gray-50 transition border-b border-gray-50">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-gray-900">${t.ticket_number}</td>
      <td class="px-6 py-4 text-sm text-gray-700 font-medium max-w-[200px] truncate">${t.title}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">
          ${t.priority}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">
          ${t.status}
        </span>
      </td>
      <td class="px-6 py-4">
        <button onclick="openTicketDetails(${t.id})"
          class="text-[#10b981] hover:text-[#059669] font-bold text-sm transition bg-green-50 px-3 py-1.5 rounded-lg">
          View Details
        </button>
      </td>
    </tr>
  `).join('');
}

// ===================== FILTERS =====================
function applyFilters() {
  const searchInput = document.querySelector('input[placeholder="Search by ID or Title..."]');
  const statusFilter = document.getElementById('statusFilter') || document.querySelector('select');

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const filterValue = statusFilter ? statusFilter.value : 'active';

  const filtered = globalTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm) ||
                          ticket.ticket_number.toLowerCase().includes(searchTerm);
    let matchesStatus = true;
    if (filterValue === 'active') {
      matchesStatus = !['resolved', 'closed'].includes(ticket.status.toLowerCase());
    } else if (filterValue !== 'all') {
      const normalized = filterValue.replace('_', ' ').toLowerCase();
      matchesStatus = ticket.status.toLowerCase() === normalized;
    }
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

// ===================== OPEN TICKET DETAILS MODAL =====================
function openTicketDetails(ticketId) {
  const ticket = globalTickets.find(t => t.id === ticketId);
  if (!ticket) return;

  currentTicketId = ticketId;

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };

  document.getElementById('detail-ticket-number').textContent = ticket.ticket_number;
  document.getElementById('detail-title').textContent = ticket.title;
  document.getElementById('detail-description').textContent = ticket.description || '—';
  document.getElementById('detail-category').textContent = ticket.category || '—';
  document.getElementById('detail-date').textContent = new Date(ticket.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  // Priority badge
  const badge = document.getElementById('detail-priority-badge');
  badge.textContent = ticket.priority;
  badge.className = `px-2 py-1 text-[10px] uppercase font-bold rounded-md ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-600'}`;

  // Set dropdowns
  document.getElementById('detail-status-select').value = ticket.status;
  document.getElementById('detail-priority-select').value = ticket.priority;
  document.getElementById('detail-assign-select').value = ticket.assigned_to || '';

  toggleDetailsModal(true);
}

// ===================== SAVE TICKET CHANGES =====================
async function saveTicketChanges() {
  const status = document.getElementById('detail-status-select').value;
  const priority = document.getElementById('detail-priority-select').value;
  const assignedTo = document.getElementById('detail-assign-select').value;

  const btn = document.getElementById('save-status-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/tickets/${currentTicketId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status,
        priority,
        assigned_to: assignedTo || null
      })
    });

    if (res.ok) {
      toggleDetailsModal(false);
      fetchTickets();
    } else {
      alert('Failed to save changes.');
    }
  } catch (err) {
    console.error('Error saving:', err);
    alert('Server connection error.');
  } finally {
    btn.textContent = 'Save Changes';
    btn.disabled = false;
  }
}

// ===================== MODAL TOGGLE =====================
function toggleDetailsModal(show) {
  const modal = document.getElementById('ticketDetailsModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

// Close on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('ticketDetailsModal')) toggleDetailsModal(false);
};