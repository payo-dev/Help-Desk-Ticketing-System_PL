const API = 'http://127.0.0.1:3000';

// Check if logged in
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

// (The user-info population lines were removed from here because layout.js handles them now)

// Logout
async function logout() {
  await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Load dashboard stats
// Load dashboard stats
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/dashboard/stats`, { credentials: 'include' });
    
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();

    // 1. Update text stats
    document.getElementById('stat-total').textContent = data.total || 0;
    document.getElementById('stat-open').textContent = data.open || 0;
    document.getElementById('stat-resolved').textContent = data.resolved_today || 0;
    document.getElementById('stat-critical').textContent = data.critical || 0;

    // 2. Update Table
    renderRecentTickets(data.recent_tickets || []);

    // 3. Update Charts with real data
    updateCharts(data);

  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// Render recent tickets table
function renderRecentTickets(tickets) {
  const tbody = document.getElementById('recent-tickets');
  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-6 font-medium">No tickets yet.</td></tr>`;
    return;
  }

  const priorityColors = {
    Critical: 'bg-red-50 text-red-600',
    High: 'bg-orange-50 text-orange-600',
    Medium: 'bg-yellow-50 text-yellow-600',
    Low: 'bg-[#ecfdf5] text-[#10b981]'
  };

  const statusColors = {
    Submitted: 'bg-blue-50 text-blue-600',
    Reviewed: 'bg-purple-50 text-purple-600',
    Assigned: 'bg-indigo-50 text-indigo-600',
    'In Progress': 'bg-yellow-50 text-yellow-600',
    'Pending User': 'bg-orange-50 text-orange-600',
    Resolved: 'bg-[#ecfdf5] text-[#10b981]',
    Closed: 'bg-gray-100 text-gray-600'
  };

  tbody.innerHTML = tickets.map(t => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
      <td class="py-3 font-mono text-xs font-semibold text-gray-900">${t.ticket_number}</td>
      <td class="py-3 text-sm font-medium text-gray-900">${t.title}</td>
      <td class="py-3 text-sm text-gray-500">${t.category}</td>
      <td class="py-3">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${priorityColors[t.priority] || ''}">
          ${t.priority}
        </span>
      </td>
      <td class="py-3">
        <span class="px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold ${statusColors[t.status] || ''}">
          ${t.status}
        </span>
      </td>
      <td class="py-3 text-gray-400 text-xs font-medium">${new Date(t.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// Charts
// Charts
// In dashboard.js
function renderCharts() {
  // Monthly Tickets Chart - Updated for smaller height
  new Chart(document.getElementById('monthlyChart'), {
    type: 'bar',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      datasets: [{ label: 'Tickets', data: [0,0,0,0,0,0,0,0,0,0,0,0], backgroundColor: '#10b981', borderRadius: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true, // Keep this true to allow ratio control
      aspectRatio: 2.5,          // INCREASE this number to make it shorter/smaller
      plugins: { legend: { display: false } },
      scales: { 
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } }
      }
    }
  });

  // Priority Doughnut Chart - Updated for smaller height
  new Chart(document.getElementById('priorityChart'), {
    type: 'doughnut',
    data: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#ef4444','#f97316','#eab308','#10b981'], borderWidth: 0, cutout: '75%' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2.2,          // INCREASE this number to make the chart area smaller
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 10 } } }
    }
  });
}


// Add this function to update the charts with real data
function updateCharts(data) {
  // 1. Update Monthly Tickets Chart
  const monthlyChart = Chart.getChart("monthlyChart");
  if (monthlyChart && data.monthly_counts) {
    monthlyChart.data.datasets[0].data = data.monthly_counts;
    monthlyChart.update();
  }

  // 2. Update Priority Doughnut Chart
  const priorityChart = Chart.getChart("priorityChart");
  if (priorityChart && data.priority_counts) {
    priorityChart.data.datasets[0].data = data.priority_counts;
    priorityChart.update();
  }
}
// Init
loadStats();
renderCharts();