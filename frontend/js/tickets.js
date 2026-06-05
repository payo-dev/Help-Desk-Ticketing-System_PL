const API = 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', () => {
    fetchTickets();

    // Handle Form Submission
    const ticketForm = document.getElementById('ticketForm');
    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('ticketTitle').value,
            category: document.getElementById('ticketCategory').value,
            priority: 'Medium', // Defaulting to Medium for now
            status: 'Submitted'
        };

        try {
            const res = await fetch(`${API}/api/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                credentials: 'include'
            });

            if (res.ok) {
                toggleModal(false); // Close modal
                ticketForm.reset(); // Clear form
                fetchTickets();     // Refresh the list
            } else {
                alert('Failed to create ticket.');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    });
});

async function fetchTickets() {
    const tbody = document.getElementById('tickets-table-body');
    
    try {
        const res = await fetch(`${API}/api/tickets`, { 
            method: 'GET',
            credentials: 'include' // Crucial: sends the session cookie
        });

        // 1. Handle Unauthenticated users
        if (res.status === 401) {
            window.location.href = 'login.html'; // Kick them back to login
            return;
        }

        // 2. Handle other errors
        if (!res.ok) {
            throw new Error(`Server error: ${res.status}`);
        }

        const tickets = await res.json();

        // 3. Ensure data is an array before mapping
        if (!Array.isArray(tickets)) {
            console.error('Expected an array but got:', tickets);
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-red-500">Error loading data.</td></tr>`;
            return;
        }

        if (tickets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No tickets found.</td></tr>`;
            return;
        }

        // 4. Populate table
        tbody.innerHTML = tickets.map(t => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 font-mono text-sm font-semibold text-gray-900">${t.ticket_number}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${t.title}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold">${t.priority}</span></td>
                <td class="px-6 py-4"><span class="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">${t.status}</span></td>
                <td class="px-6 py-4"><button class="text-indigo-600 hover:text-indigo-900 font-medium">View</button></td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Error loading tickets:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Failed to load tickets. Please check backend.</td></tr>`;
    }
}

function toggleModal(show) {
    document.getElementById('ticketModal').classList.toggle('hidden', !show);
}