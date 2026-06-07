const API = 'http://127.0.0.1:3000';
let globalResolved = [];
let currentTicketId = null;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  fetchResolvedTickets();
  document.getElementById('resolvedSearch').addEventListener('input', applySearch);
});

// ===================== FETCH =====================
async function fetchResolvedTickets() {
  try {
    const res = await fetch(`${API}/api/tickets/my`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';

    const all = await res.json();

    // Filter only resolved and closed
    globalResolved = all.filter(t => t.status === 'Resolved' || t.status === 'Closed');

    updateStats(globalResolved, all);
    renderTable(globalResolved);
  } catch (err) {
    console.error('Error:', err);
  }
}

// ===================== STATS =====================
function updateStats(resolved, all) {
  document.getElementById('stat-resolved').textContent =
    resolved.filter(t => t.status === 'Resolved').length;
  document.getElementById('stat-closed').textContent =
    resolved.filter(t => t.status === 'Closed').length;

  const thisMonth = resolved.filter(t => {
    const d = new Date(t.updated_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  document.getElementById('stat-month').textContent = thisMonth;
}

// ===================== RENDER TABLE =====================
function renderTable(tickets) {
  const tbody = document.getElementById('resolved-tickets-body');
  if (!tbody) return;

  if (tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-10 text-gray-400">
          <div class="flex flex-col items-center gap-2">
            <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            No resolved tickets yet.
          </div>
        </td>
      </tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };

  tbody.innerHTML = tickets.map(t => `
    <tr class="hover:bg-gray-50 transition border-b border-gray-50 cursor-pointer" onclick="viewTicket(${t.id})">
      <td class="px-6 py-4 font-mono text-xs font-bold text-gray-900">${t.ticket_number}</td>
      <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-[180px] truncate">${t.title}</td>
      <td class="px-6 py-4 text-sm text-gray-500">${t.category || '—'}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">
          ${t.priority}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase font-bold ${t.status === 'Resolved' ? 'bg-green-50 text-[#10b981]' : 'bg-gray-100 text-gray-500'}">
          ${t.status}
        </span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-400 font-medium">
        ${new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td class="px-6 py-4">
        <button onclick="event.stopPropagation(); viewTicket(${t.id})"
          class="text-[#10b981] hover:text-[#059669] bg-green-50 hover:bg-green-100 text-xs font-bold px-3 py-1.5 rounded-lg transition">
          View
        </button>
      </td>
    </tr>
  `).join('');
}

// ===================== SEARCH =====================
function applySearch() {
  const term = document.getElementById('resolvedSearch').value.toLowerCase();
  const filtered = globalResolved.filter(t =>
    t.title.toLowerCase().includes(term) ||
    t.ticket_number.toLowerCase().includes(term) ||
    (t.category && t.category.toLowerCase().includes(term))
  );
  renderTable(filtered);
}

// ===================== VIEW TICKET MODAL =====================
function viewTicket(id) {
  const t = globalResolved.find(t => t.id === id);
  if (!t) return;

  currentTicketId = t.id;
  selectedRating = 0;

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };

  document.getElementById('view-ticket-number').textContent = t.ticket_number;
  document.getElementById('view-title').textContent = t.title;
  document.getElementById('view-category').textContent = t.category || '—';
  document.getElementById('view-description').textContent = t.description || '—';
  document.getElementById('view-date').textContent = new Date(t.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('view-updated').textContent = new Date(t.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Priority badge
  const prioEl = document.getElementById('view-priority');
  prioEl.textContent = t.priority;
  prioEl.className = `text-xs font-bold px-2 py-1 rounded-md ${priorityColors[t.priority] || 'bg-gray-100 text-gray-600'}`;

  // Status banner
  const bannerEl = document.getElementById('view-status-banner');
  const statusTextEl = document.getElementById('view-status-text');
  statusTextEl.textContent = t.status;
  if (t.status === 'Closed') {
    bannerEl.className = 'flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3';
    statusTextEl.className = 'text-sm font-bold text-gray-600';
  } else {
    bannerEl.className = 'flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3';
    statusTextEl.className = 'text-sm font-bold text-green-700';
  }

  // Reset stars
  resetStars();
  document.getElementById('rating-feedback').value = '';

  openViewModal();
}

// ===================== RATING =====================
function setRating(value) {
  selectedRating = value;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('text-yellow-400', parseInt(btn.dataset.value) <= value);
    btn.classList.toggle('text-gray-300', parseInt(btn.dataset.value) > value);
  });
}

function resetStars() {
  selectedRating = 0;
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.remove('text-yellow-400');
    btn.classList.add('text-gray-300');
  });
}

async function submitRating() {
  if (selectedRating === 0) {
    alert('Please select a star rating first.');
    return;
  }

  const feedback = document.getElementById('rating-feedback').value;
  const btn = document.getElementById('rating-btn');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/tickets/${currentTicketId}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rating: selectedRating, feedback })
    });

    if (res.ok) {
      document.getElementById('rating-section').innerHTML = `
        <div class="flex items-center gap-3 text-[#10b981]">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-sm font-bold text-green-700">Thank you for your feedback! ⭐ ${selectedRating}/5</p>
        </div>`;
    } else {
      alert('Failed to submit rating.');
      btn.textContent = 'Submit Rating';
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    btn.textContent = 'Submit Rating';
    btn.disabled = false;
  }
}

// ===================== HELPERS =====================
function openViewModal() {
  const modal = document.getElementById('viewTicketModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeViewModal() {
  const modal = document.getElementById('viewTicketModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

window.onclick = function(e) {
  if (e.target === document.getElementById('viewTicketModal')) closeViewModal();
};