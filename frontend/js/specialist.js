const API = 'http://127.0.0.1:3000';
let currentTicketId = null;
let currentUser = null;
let allMyTickets = [];
let allPoolTickets = [];

// ===================== DEPARTMENT CONFIG =====================
// Maps department name → which ticket categories belong to them
const DEPT_CONFIG = {
  'IT Department':      { categories: ['IT Support'],          color: 'indigo', label: 'IT Support',    badge: 'bg-indigo-100 text-indigo-700' },
  'Human Resources':    { categories: ['HR Concern'],          color: 'pink',   label: 'HR',            badge: 'bg-pink-100 text-pink-700' },
  'Finance':            { categories: ['Finance Request'],     color: 'yellow', label: 'Finance',       badge: 'bg-yellow-100 text-yellow-700' },
  'Facilities':         { categories: ['Facilities Request'],  color: 'orange', label: 'Facilities',    badge: 'bg-orange-100 text-orange-700' },
  'Procurement':        { categories: ['Procurement Request'], color: 'purple', label: 'Procurement',   badge: 'bg-purple-100 text-purple-700' },
  'General Operations': { categories: ['General Inquiry'],     color: 'gray',   label: 'General Ops',   badge: 'bg-gray-100 text-gray-700' },
  'Operations':         { categories: ['General Inquiry'],     color: 'gray',   label: 'General Ops',   badge: 'bg-gray-100 text-gray-700' },
};

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) return window.location.href = 'login.html';

  applyDeptTheme();
  fetchSpecialistQueue();
});

// ===================== APPLY DEPARTMENT THEME =====================
function applyDeptTheme() {
  const dept = currentUser.department || 'IT Department';
  const config = DEPT_CONFIG[dept] || DEPT_CONFIG['IT Department'];

  // Sidebar label
  const label = document.getElementById('sidebar-dept-label');
  if (label) {
    label.textContent = config.label + ' Specialist';
    label.className = `text-[10px] font-bold uppercase tracking-wider mt-1 text-${config.color}-600`;
  }

  // Page title & subtitle
  const title = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  if (title) title.textContent = `${config.label} Workspace`;
  if (subtitle) subtitle.textContent = `Managing ${config.label} tickets assigned to you.`;

  // Dept badge in header
  const badge = document.getElementById('dept-badge');
  if (badge) {
    badge.textContent = config.label;
    badge.className = `text-xs font-bold uppercase px-3 py-1 rounded-full ${config.badge}`;
  }

  // Pool label
  const poolLabel = document.getElementById('pool-category-label');
  if (poolLabel) {
    poolLabel.textContent = config.label === 'General Ops' 
      ? `Filtered: General Inquiry tickets only`
      : `Filtered: ${config.label} & General Inquiry tickets`;
  }
}

// ===================== FETCH QUEUE =====================
async function fetchSpecialistQueue() {
  try {
    const res = await fetch(`${API}/api/tickets/queue/specialist`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';

    const data = await res.json();
    allMyTickets = data.myTickets || [];
    allPoolTickets = data.unassigned || [];

    updateStats();
    renderMyTickets(allMyTickets);
    renderPoolTickets(allPoolTickets);
  } catch (err) {
    console.error('Error fetching queue:', err);
  }
}

// ===================== STATS =====================
function updateStats() {
  const inProgress = allMyTickets.filter(t => t.status === 'In Progress').length;
  const today = new Date().toDateString();
  const resolvedToday = allMyTickets.filter(t =>
    t.status === 'Resolved' && new Date(t.updated_at).toDateString() === today
  ).length;

  document.getElementById('stat-mine').textContent = allMyTickets.length;
  document.getElementById('stat-inprogress').textContent = inProgress;
  document.getElementById('stat-resolved').textContent = resolvedToday;
  document.getElementById('stat-pool').textContent = allPoolTickets.length;
  document.getElementById('header-active-count').textContent = allMyTickets.length;

  // Queue badge
  const badge = document.getElementById('queue-badge');
  if (allMyTickets.length > 0) {
    badge.textContent = allMyTickets.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ===================== RENDER MY TICKETS =====================
function renderMyTickets(tickets) {
  const tbody = document.getElementById('my-tickets-tbody');

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-400 font-medium">
      🎉 No active tickets assigned to you.
    </td></tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };
  const statusColors = {
    Assigned:       'bg-indigo-50 text-indigo-600',
    'In Progress':  'bg-yellow-50 text-yellow-600',
    'Pending User': 'bg-orange-50 text-orange-600',
    Resolved:       'bg-green-50 text-[#10b981]',
  };

  tbody.innerHTML = tickets.map(t => {
    const sla = getSLAText(t);
    return `
    <tr class="hover:bg-gray-50 transition border-b border-gray-50">
      <td class="px-6 py-4">
        <p class="text-[10px] font-mono font-bold text-gray-400">${t.ticket_number}</p>
        <p class="text-sm font-semibold text-gray-900">${t.title}</p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">${t.category || '—'}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-[10px] uppercase font-bold rounded-md ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">
          ${t.priority}
        </span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-[10px] uppercase font-bold rounded-md ${statusColors[t.status] || 'bg-gray-100 text-gray-500'}">
          ${t.status}
        </span>
      </td>
      <td class="px-6 py-4 text-xs font-semibold ${sla.color}">${sla.text}</td>
      <td class="px-6 py-4">
        <button onclick='openWorkModal(${JSON.stringify(t).replace(/'/g, "&#39;")})'
          class="text-[#10b981] hover:text-[#059669] bg-green-50 hover:bg-green-100 text-xs font-bold px-3 py-1.5 rounded-lg transition">
          Work Ticket →
        </button>
      </td>
    </tr>
  `}).join('');
}

// ===================== RENDER POOL TICKETS =====================
function renderPoolTickets(tickets) {
  const tbody = document.getElementById('pool-tickets-tbody');

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400 font-medium">
      The pool is empty for your department.
    </td></tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High:     'bg-orange-50 text-orange-600',
    Medium:   'bg-yellow-50 text-yellow-600',
    Low:      'bg-green-50 text-[#10b981]'
  };

  tbody.innerHTML = tickets.map(t => `
    <tr class="hover:bg-gray-50 transition border-b border-gray-50">
      <td class="px-6 py-4">
        <p class="text-[10px] font-mono font-bold text-gray-400">${t.ticket_number}</p>
        <p class="text-sm font-semibold text-gray-900">${t.title}</p>
      </td>
      <td class="px-6 py-4 text-sm text-gray-500">${t.category || '—'}</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-[10px] uppercase font-bold rounded-md ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">
          ${t.priority}
        </span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-400 font-medium">
        ${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td class="px-6 py-4">
        <button onclick="claimTicket(${t.id}, this)"
          class="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition">
          Claim Ticket
        </button>
      </td>
    </tr>
  `).join('');
}

// ===================== SLA HELPER =====================
function getSLAText(ticket) {
  if (!ticket.sla_deadline) return { text: 'No SLA', color: 'text-gray-400' };
  const now = new Date();
  const deadline = new Date(ticket.sla_deadline);
  const diffMs = deadline - now;

  if (diffMs < 0) return { text: 'Overdue!', color: 'text-red-500' };
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffH < 1) return { text: `${diffM}m left`, color: 'text-red-500' };
  if (diffH < 4) return { text: `${diffH}h ${diffM}m`, color: 'text-orange-500' };
  return { text: `${diffH}h left`, color: 'text-gray-400' };
}

// ===================== CLAIM TICKET =====================
async function claimTicket(ticketId, btn) {
  if (btn) {
    btn.textContent = 'Claiming...';
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  try {
    const res = await fetch(`${API}/api/tickets/${ticketId}/claim`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (res.ok) {
      fetchSpecialistQueue();
      showToast('Ticket claimed and assigned to your queue!');
    } else {
      alert('Failed to claim ticket.');
    }
  } catch (err) {
    console.error('Error claiming:', err);
  } finally {
    if (btn) {
      btn.textContent = 'Claim Ticket';
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

// ===================== OPEN WORK MODAL =====================
function openWorkModal(ticket) {
  currentTicketId = ticket.id;
  document.getElementById('work-ticket-number').textContent = ticket.ticket_number;
  document.getElementById('work-ticket-title').textContent = ticket.title;
  document.getElementById('work-ticket-desc').textContent = ticket.description || 'No description provided.';
  document.getElementById('work-ticket-category').textContent = ticket.category || '—';
  document.getElementById('work-ticket-priority').textContent = ticket.priority || '—';
  document.getElementById('update-status-select').value = ticket.status === 'Assigned' ? 'In Progress' : ticket.status;
  document.getElementById('work-notes').value = '';

  const modal = document.getElementById('workModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function toggleWorkModal(show) {
  const modal = document.getElementById('workModal');
  modal.classList.toggle('hidden', !show);
  modal.classList.toggle('flex', show);
}

// ===================== SAVE STATUS =====================
async function saveStatus() {
  const status = document.getElementById('update-status-select').value;
  const notes = document.getElementById('work-notes').value;
  const btn = document.getElementById('btn-update-status');

  if (btn) {
    btn.textContent = 'Updating...';
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
  }

  try {
    const res = await fetch(`${API}/api/tickets/${currentTicketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, notes })
    });

    if (res.ok) {
      toggleWorkModal(false);
      fetchSpecialistQueue();
      if (status === 'Resolved') {
        showToast('Ticket resolved! Removed from active queue.');
      } else {
        showToast('Ticket status updated.');
      }
    } else {
      try {
        const errData = await res.json();
        alert(`Failed to update status: ${errData.message || 'Server Error'}`);
      } catch (parseErr) {
        alert(`Failed to update status: ${res.status} ${res.statusText}`);
      }
    }
  } catch (err) {
    console.error('Error updating:', err);
  } finally {
    if (btn) {
      btn.textContent = 'Update';
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  }
}

// ===================== TRANSFER TICKET =====================
async function transferTicket() {
  const newCategory = document.getElementById('transfer-dept-select').value;
  if (!confirm(`Transfer this ticket to ${newCategory}? It will be unassigned.`)) return;

  const btn = document.getElementById('btn-transfer-ticket');
  if (btn) {
    btn.textContent = 'Transferring...';
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  try {
    const res = await fetch(`${API}/api/tickets/${currentTicketId}/transfer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ category: newCategory })
    });

    if (res.ok) {
      toggleWorkModal(false);
      fetchSpecialistQueue();
      showToast(`Ticket transferred to ${newCategory}.`);
    } else {
      alert('Failed to transfer ticket.');
    }
  } catch (err) {
    console.error('Error transferring:', err);
  } finally {
    if (btn) {
      btn.textContent = 'Transfer';
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  }
}

// ===================== TOAST NOTIFICATION =====================
function showToast(msg) {
  const toast = document.getElementById('success-toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('flex');
  
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 3000);
}

// Close on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('workModal')) toggleWorkModal(false);
};