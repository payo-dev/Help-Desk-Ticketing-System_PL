// ===================== NOTIFICATIONS SYSTEM =====================
// Include this file in every page: <script src="js/notifications.js"></script>
// Place the bell HTML in every header

const NOTIF_API = 'http://127.0.0.1:3000';
let notifPollingInterval = null;

// ===================== INJECT BELL INTO HEADER =====================
function injectNotificationBell() {
  // Prevent duplicate injection if bell is already hardcoded on the page
  if (document.getElementById('notif-wrapper')) return;

  const header = document.querySelector('header');
  if (!header) return;

  // Find the right side of the header
  const rightSide = header.querySelector('.flex.items-center.gap-3, .flex.items-center.gap-5, .flex.items-center.gap-4');
  if (!rightSide) return;

  const bellHTML = `
    <div class="relative" id="notif-wrapper">
      <button id="notif-bell-btn" onclick="toggleNotifDropdown()"
        class="relative p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[#10b981] hover:border-[#10b981] transition shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <span id="notif-badge"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center hidden">
          0
        </span>
      </button>

      <!-- Dropdown -->
      <div id="notif-dropdown"
        class="hidden absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
        
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h4 class="text-sm font-bold text-gray-900">Notifications</h4>
          <div class="flex items-center gap-3">
            <button onclick="markAllRead()" class="text-xs text-[#10b981] font-semibold hover:underline">Mark all read</button>
          </div>
        </div>

        <div id="notif-list" class="max-h-80 overflow-y-auto divide-y divide-gray-50">
          <div class="px-5 py-6 text-center text-sm text-gray-400">Loading...</div>
        </div>

      </div>
    </div>
  `;

  rightSide.insertAdjacentHTML('afterbegin', bellHTML);
}

// ===================== TOGGLE DROPDOWN =====================
function toggleNotifDropdown() {
  const dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  const isHidden = dropdown.classList.contains('hidden');
  dropdown.classList.toggle('hidden', !isHidden);
  if (isHidden) fetchNotifications();
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('notif-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
  }
});

// ===================== FETCH NOTIFICATIONS =====================
async function fetchNotifications() {
  try {
    const res = await fetch(`${NOTIF_API}/api/notifications`, { credentials: 'include' });
    if (!res.ok) return;

    const notifications = await res.json();
    updateBadge(notifications);
    renderDropdown(notifications.slice(0, 6)); // Show latest 6 in dropdown
  } catch (err) {
    console.error('Notification fetch error:', err);
  }
}

// ===================== UPDATE BADGE =====================
function updateBadge(notifications) {
  const unread = notifications.filter(n => !n.is_read).length;
  const badge = document.getElementById('notif-badge');
  if (!badge) return;

  if (unread > 0) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ===================== RENDER DROPDOWN =====================
function renderDropdown(notifications) {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = `
      <div class="px-5 py-8 text-center">
        <svg class="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <p class="text-sm text-gray-400 font-medium">You're all caught up!</p>
      </div>`;
    return;
  }

  const typeIcons = {
    'ticket_assigned':       { icon: '🎫', color: 'bg-indigo-50' },
    'status_changed':        { icon: '🔄', color: 'bg-yellow-50' },
    'new_ticket':            { icon: '📋', color: 'bg-blue-50' },
    'ticket_resolved':       { icon: '✅', color: 'bg-green-50' },
    'maintenance_due':       { icon: '🔧', color: 'bg-orange-50' },
    'warranty_expiring':     { icon: '⚠️', color: 'bg-red-50' },
  };

  list.innerHTML = notifications.map(n => {
    const type = typeIcons[n.type] || { icon: '🔔', color: 'bg-gray-50' };
    const timeAgo = getTimeAgo(n.created_at);
    return `
      <div onclick="markRead(${n.id}, this)"
        class="px-5 py-3.5 hover:bg-gray-50 transition cursor-pointer flex items-start gap-3 ${!n.is_read ? 'bg-blue-50/30' : ''}">
        <div class="w-8 h-8 ${type.color} rounded-xl flex items-center justify-center flex-shrink-0 text-sm">
          ${type.icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-gray-900 leading-snug">${n.title}</p>
          <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">${n.message}</p>
          <p class="text-[10px] text-gray-400 mt-1">${timeAgo}</p>
        </div>
        ${!n.is_read ? '<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>' : ''}
      </div>
    `;
  }).join('');
}

// ===================== MARK ONE AS READ =====================
async function markRead(notifId, el) {
  try {
    await fetch(`${NOTIF_API}/api/notifications/${notifId}/read`, {
      method: 'PUT',
      credentials: 'include'
    });
    // Remove unread dot and background
    el.classList.remove('bg-blue-50/30');
    const dot = el.querySelector('.bg-blue-500');
    if (dot) dot.remove();
    fetchNotifications(); // refresh badge count
  } catch (err) {
    console.error(err);
  }
}

// ===================== MARK ALL READ =====================
async function markAllRead() {
  try {
    await fetch(`${NOTIF_API}/api/notifications/read-all`, {
      method: 'PUT',
      credentials: 'include'
    });
    fetchNotifications();
    const list = document.getElementById('notif-list');
    if (list) {
      list.querySelectorAll('.bg-blue-50\\/30').forEach(el => el.classList.remove('bg-blue-50/30'));
      list.querySelectorAll('.bg-blue-500.rounded-full').forEach(el => el.remove());
    }
  } catch (err) {
    console.error(err);
  }
}

// ===================== TIME AGO HELPER =====================
function getTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffM < 1)  return 'Just now';
  if (diffM < 60) return `${diffM}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  if (diffD < 7)  return `${diffD}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ===================== AUTO POLL EVERY 30s =====================
function startNotifPolling() {
  fetchNotifications();
  notifPollingInterval = setInterval(fetchNotifications, 30000);
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;
  injectNotificationBell();
  startNotifPolling();
});