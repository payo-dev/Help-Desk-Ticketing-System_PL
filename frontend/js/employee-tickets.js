const API = 'http://127.0.0.1:3000';
let globalMyTickets = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchMyTickets();

  // Live search
  const searchInput = document.getElementById('ticketSearch');
  if (searchInput) searchInput.addEventListener('input', applySearch);
});

// ===================== FETCH MY TICKETS =====================
async function fetchMyTickets() {
  try {
    const res = await fetch(`${API}/api/tickets/my`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';
    if (!res.ok) throw new Error('Server error');

    globalMyTickets = await res.json();
    updateStats(globalMyTickets);
    renderTable(globalMyTickets);
  } catch (err) {
    console.error('Error fetching tickets:', err);
  }
}

// ===================== STATS =====================
function updateStats(tickets) {
  document.getElementById('emp-stat-total').textContent = tickets.length;
  document.getElementById('emp-stat-open').textContent =
    tickets.filter(t => ['In Progress', 'Assigned', 'Reviewed', 'Submitted'].includes(t.status)).length;
  document.getElementById('emp-stat-resolved').textContent =
    tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
  document.getElementById('emp-stat-pending').textContent =
    tickets.filter(t => t.status === 'Pending User').length;
}

// ===================== RENDER TABLE =====================
function renderTable(tickets) {
  const tbody = document.getElementById('employee-tickets-body');
  if (!tbody) return;

  if (tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-gray-400 font-medium">
          <div class="flex flex-col items-center gap-2">
            <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            No tickets found.
          </div>
        </td>
      </tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High: 'bg-orange-50 text-orange-600',
    Medium: 'bg-yellow-50 text-yellow-600',
    Low: 'bg-green-50 text-[#10b981]'
  };

  const statusColors = {
    Submitted: 'bg-blue-50 text-blue-600',
    Reviewed: 'bg-purple-50 text-purple-600',
    Assigned: 'bg-indigo-50 text-indigo-600',
    'In Progress': 'bg-yellow-50 text-yellow-600',
    'Pending User': 'bg-orange-50 text-orange-600',
    Resolved: 'bg-green-50 text-[#10b981]',
    Closed: 'bg-gray-100 text-gray-500'
  };

  tbody.innerHTML = tickets.map(t => `
    <tr class="hover:bg-gray-50 transition border-b border-gray-50">
      <td class="px-6 py-4 font-mono text-xs font-bold text-gray-900">${t.ticket_number}</td>
      <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-[180px] truncate">${t.title}</td>
      <td class="px-6 py-4 text-sm text-gray-500">${t.category || '—'}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">
          ${t.priority}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">
          ${t.status}
        </span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-400 font-medium">${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td class="px-6 py-4">
        <button onclick="viewTicket(${t.id})"
          class="text-[#10b981] hover:text-[#059669] bg-green-50 hover:bg-green-100 text-xs font-bold px-3 py-1.5 rounded-lg transition">
          View
        </button>
      </td>
    </tr>
  `).join('');
}

// ===================== SEARCH =====================
function applySearch() {
  const term = document.getElementById('ticketSearch').value.toLowerCase();
  const filtered = globalMyTickets.filter(t =>
    t.title.toLowerCase().includes(term) ||
    t.ticket_number.toLowerCase().includes(term) ||
    (t.category && t.category.toLowerCase().includes(term))
  );
  renderTable(filtered);
}

// ===================== CATEGORY SELECTION =====================
function selectCategory(el) {
  document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');

  const cat = el.dataset.category;
  document.getElementById('selected-category').value = cat;
  document.getElementById('category-error').classList.add('hidden');

  // Hide all dynamic fields using style
  document.querySelectorAll('.dynamic-field').forEach(f => f.style.display = 'none');

  // Show only the matching one
  const fieldEl = document.getElementById(`field-${cat}`);
  if (fieldEl) {
    fieldEl.style.display = cat === 'Procurement Request' ? 'block' : 'grid';
  }
}

// ===================== SUBMIT TICKET =====================
async function submitTicket() {
  const category = document.getElementById('selected-category').value;
  const title = document.getElementById('ticket-title').value.trim();
  const description = document.getElementById('ticket-description').value.trim();
  const priority = document.querySelector('input[name="priority"]:checked').value;

  const errorEl = document.getElementById('submit-error');
  errorEl.classList.add('hidden');

  // Validation
  if (!category) {
    document.getElementById('category-error').classList.remove('hidden');
    return;
  }
  if (!title) {
    errorEl.textContent = 'Please enter a ticket title.';
    errorEl.classList.remove('hidden');
    return;
  }
  if (!description) {
    errorEl.textContent = 'Please describe your issue.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Build extra notes from dynamic fields
  let extraNotes = '';
  if (category === 'IT Support') {
    const assetId = document.getElementById('it-asset-id').value;
    const issueType = document.getElementById('it-issue-type').value;
    if (assetId) extraNotes += `Asset ID: ${assetId}. `;
    if (issueType) extraNotes += `Issue Type: ${issueType}.`;
  } else if (category === 'HR Concern') {
    const empId = document.getElementById('hr-employee-id').value;
    const concernType = document.getElementById('hr-concern-type').value;
    if (empId) extraNotes += `Employee ID: ${empId}. `;
    if (concernType) extraNotes += `Concern: ${concernType}.`;
  } else if (category === 'Finance Request') {
    const ref = document.getElementById('finance-ref').value;
    const type = document.getElementById('finance-type').value;
    if (ref) extraNotes += `Reference #: ${ref}. `;
    if (type) extraNotes += `Type: ${type}.`;
  } else if (category === 'Facilities Request') {
    const loc = document.getElementById('facilities-location').value;
    const room = document.getElementById('facilities-room').value;
    if (loc) extraNotes += `Location: ${loc}. `;
    if (room) extraNotes += `Room: ${room}.`;
  } else if (category === 'Procurement Request') {
    const item = document.getElementById('procurement-item').value;
    if (item) extraNotes += `Item requested: ${item}.`;
  }

  const fullDescription = extraNotes ? `${description}\n\n--- Additional Info ---\n${extraNotes}` : description;

  const btn = document.getElementById('submit-btn');
  btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Submitting...`;
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description: fullDescription, category, priority })
    });

    const data = await res.json();

    if (res.ok) {
      toggleSubmitModal(false);
      resetForm();
      fetchMyTickets();
      showToast(data.ticket_number || 'Ticket submitted!');
    } else {
      errorEl.textContent = data.message || 'Failed to submit ticket.';
      errorEl.classList.remove('hidden');
    }
  } catch (err) {
    errorEl.textContent = 'Cannot connect to server.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> Submit Ticket`;
    btn.disabled = false;
  }
}

// ===================== VIEW TICKET MODAL =====================
function viewTicket(id) {
  const t = globalMyTickets.find(t => t.id === id);
  if (!t) return;

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High: 'bg-orange-50 text-orange-600',
    Medium: 'bg-yellow-50 text-yellow-600',
    Low: 'bg-green-50 text-[#10b981]'
  };
  const statusColors = {
    Submitted: 'bg-blue-50 text-blue-600',
    Reviewed: 'bg-purple-50 text-purple-600',
    Assigned: 'bg-indigo-50 text-indigo-600',
    'In Progress': 'bg-yellow-50 text-yellow-600',
    'Pending User': 'bg-orange-50 text-orange-600',
    Resolved: 'bg-green-50 text-[#10b981]',
    Closed: 'bg-gray-100 text-gray-500'
  };

  document.getElementById('view-ticket-number').textContent = t.ticket_number;
  document.getElementById('view-title').textContent = t.title;
  document.getElementById('view-category').textContent = t.category || '—';
  document.getElementById('view-description').textContent = t.description || '—';
  document.getElementById('view-date').textContent = new Date(t.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const prioEl = document.getElementById('view-priority');
  prioEl.textContent = t.priority;
  prioEl.className = `text-xs font-bold px-2 py-1 rounded-md ${priorityColors[t.priority] || 'bg-gray-100 text-gray-600'}`;

  const statusEl = document.getElementById('view-status');
  statusEl.textContent = t.status;
  statusEl.className = `text-xs font-bold px-2 py-1 rounded-md ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}`;

  toggleViewModal(true);
}

// ===================== HELPERS =====================
function toggleSubmitModal(show) {
  const modal = document.getElementById('submitTicketModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

function toggleViewModal(show) {
  const modal = document.getElementById('viewTicketModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

function resetForm() {
  document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('selected-category').value = '';
  document.getElementById('ticket-title').value = '';
  document.getElementById('ticket-description').value = '';
  document.querySelectorAll('.dynamic-field').forEach(f => f.classList.remove('visible'));
  document.querySelector('input[name="priority"][value="Low"]').checked = true;
  document.getElementById('submit-error').classList.add('hidden');
  document.getElementById('category-error').classList.add('hidden');
}

function showToast(ticketNumber) {
  const toast = document.getElementById('success-toast');
  document.getElementById('toast-ticket-number').textContent = `Ticket ${ticketNumber} has been received.`;
  toast.classList.remove('hidden');
  toast.classList.add('flex');
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 4000);
}

// Close modals on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('submitTicketModal')) toggleSubmitModal(false);
  if (e.target === document.getElementById('viewTicketModal')) toggleViewModal(false);
};