const API = 'http://127.0.0.1:3000';
let currentTicketId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchSpecialistQueue();
});

async function fetchSpecialistQueue() {
    try {
        const res = await fetch(`${API}/api/tickets/queue/specialist`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';
        
        const data = await res.json();
        renderMyTickets(data.myTickets);
        renderPoolTickets(data.unassigned);
    } catch (err) {
        console.error("Error fetching queue:", err);
    }
}

function renderMyTickets(tickets) {
    const tbody = document.getElementById('my-tickets-tbody');
    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-6 text-center text-sm text-gray-400">You have no active tickets. Great job!</td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="px-6 py-4">
                <p class="text-xs font-mono font-bold text-gray-400">${t.ticket_number}</p>
                <p class="text-sm font-semibold text-gray-900">${t.title}</p>
            </td>
            <td class="px-6 py-4"><span class="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">${t.status}</span></td>
            <td class="px-6 py-4">
                <button onclick='openWorkModal(${JSON.stringify(t).replace(/'/g, "&#39;")})' class="text-indigo-600 font-bold text-sm hover:underline">Work Ticket →</button>
            </td>
        </tr>
    `).join('');
}

function renderPoolTickets(tickets) {
    const tbody = document.getElementById('pool-tickets-tbody');
    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-6 text-center text-sm text-gray-400">The unassigned pool is empty.</td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr class="hover:bg-gray-50 border-b border-gray-50">
            <td class="px-6 py-4">
                <p class="text-xs font-mono font-bold text-gray-400">${t.ticket_number}</p>
                <p class="text-sm font-semibold text-gray-900">${t.title}</p>
            </td>
            <td class="px-6 py-4"><span class="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-lg">${t.priority}</span></td>
            <td class="px-6 py-4">
                <button onclick="claimTicket(${t.id})" class="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition">Claim Ticket</button>
            </td>
        </tr>
    `).join('');
}

// === ACTIONS ===

// 1. Claim a ticket from the pool
async function claimTicket(ticketId) {
    try {
        // We reuse the existing status update route, or assign route.
        // Assuming your auth sets the assigned_to automatically, or we pass it.
        // For now, let's use the admin assign route and pass our own ID (The backend should ideally handle 'claim' securely).
        const userId = 2; // In a real app, backend infers this from req.session.user
        await fetch(`${API}/api/tickets/${ticketId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assigned_to: userId, status: 'In Progress', priority: 'Medium' }),
            credentials: 'include'
        });
        fetchSpecialistQueue(); // Refresh tables!
    } catch (err) { console.error("Error claiming:", err); }
}

// 2. Open Modal to Work on Ticket
function openWorkModal(ticket) {
    currentTicketId = ticket.id;
    document.getElementById('work-ticket-number').textContent = ticket.ticket_number;
    document.getElementById('work-ticket-title').textContent = ticket.title;
    document.getElementById('work-ticket-desc').textContent = ticket.description || 'No description provided.';
    document.getElementById('update-status-select').value = ticket.status;
    
    document.getElementById('workModal').classList.remove('hidden');
}

function toggleWorkModal(show) {
    const modal = document.getElementById('workModal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

// 3. Update Status
async function saveStatus() {
    const status = document.getElementById('update-status-select').value;
    try {
        await fetch(`${API}/api/tickets/${currentTicketId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
            credentials: 'include'
        });
        toggleWorkModal(false);
        fetchSpecialistQueue();
    } catch (err) { console.error("Error updating:", err); }
}

// 4. Transfer Ticket (Misrouted)
async function transferTicket() {
    const deptId = document.getElementById('transfer-dept-select').value;
    if(!confirm("Are you sure you want to remove this from IT and send it to another department?")) return;

    try {
        await fetch(`${API}/api/tickets/${currentTicketId}/transfer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_department_id: deptId }),
            credentials: 'include'
        });
        toggleWorkModal(false);
        fetchSpecialistQueue();
    } catch (err) { console.error("Error transferring:", err); }
}