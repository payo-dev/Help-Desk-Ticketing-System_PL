const API = 'http://127.0.0.1:3000';
let currentUser = null;
let allResolvedTickets = [];

// ===================== DEPARTMENT CONFIG =====================
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
  fetchResolvedTickets();
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
  if (title) title.textContent = `Resolved Tickets`;
  if (subtitle) subtitle.textContent = `History of tickets resolved by your department.`;

  // Dept badge in header
  const badge = document.getElementById('dept-badge');
  if (badge) {
    badge.textContent = config.label;
    badge.className = `text-xs font-bold uppercase px-3 py-1 rounded-full ${config.badge}`;
  }
}

// ===================== FETCH QUEUE =====================
async function fetchResolvedTickets() {
  try {
    const res = await fetch(`${API}/api/tickets/queue/specialist`, { credentials: 'include' });
    if (res.status === 401) return window.location.href = 'login.html';

    const data = await res.json();
    allResolvedTickets = data.resolvedTickets || [];

    updateStats();
    renderResolvedTickets(allResolvedTickets);
  } catch (err) {
    console.error('Error fetching resolved tickets:', err);
  }
}

// ===================== STATS =====================
function updateStats() {
  const headerResolvedCount = document.getElementById('header-resolved-count');
  if (headerResolvedCount) {
    headerResolvedCount.textContent = allResolvedTickets.length;
  }
}

// ===================== RENDER RESOLVED TICKETS =====================
function renderResolvedTickets(tickets) {
  const tbody = document.getElementById('resolved-tickets-tbody');

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-sm text-gray-400 font-medium">
      No resolved tickets yet.
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
        <span class="px-2 py-1 text-[10px] uppercase font-bold rounded-md ${priorityColors[t.priority] || 'bg-gray-100 text-gray-500'}">${t.priority}</span>
      </td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-[10px] uppercase font-bold rounded-md ${t.status === 'Resolved' ? 'bg-green-50 text-[#10b981]' : 'bg-gray-100 text-gray-500'}">${t.status}</span>
      </td>
      <td class="px-6 py-4 text-xs text-gray-400 font-medium">
        ${new Date(t.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
    </tr>
  `).join('');
}
