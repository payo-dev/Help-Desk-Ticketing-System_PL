const API = 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', fetchApprovals);

async function fetchApprovals() {
    console.log("Step 1: Fetching data...");
    try {
        const res = await fetch(`${API}/api/approvals`, { credentials: 'include' });
        const data = await res.json();
        
        console.log("Step 2: Data received:", data); 

        const tbody = document.getElementById('approvals-body');
        
        // Debugging the DOM element
        if (!tbody) {
            console.error("CRITICAL ERROR: No element found with ID 'approvals-body'. Check your HTML!");
            return;
        }

        if (!Array.isArray(data)) {
            console.error("Error: Data is not an array!");
            return;
        }

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-8">No data found.</td></tr>`;
            return;
        }

        console.log("Step 3: Rendering", data.length, "rows.");

        // The Rendering Logic
        tbody.innerHTML = data.map(r => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-semibold text-gray-900">${r.first_name || 'N/A'} ${r.last_name || ''}</td>
                <td class="px-6 py-4 text-gray-700">${r.ticket_title || 'N/A'}</td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 rounded-md text-xs font-bold 
                        ${r.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' : 
                        r.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}">
                        ${r.status}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    ${r.status === 'Pending' ? `
                        <button onclick="handleAction(${r.id}, 'Approved')" class="text-green-600 font-bold hover:underline mr-4">Approve</button>
                        <button onclick="handleAction(${r.id}, 'Rejected')" class="text-red-600 font-bold hover:underline">Reject</button>
                    ` : '<span class="text-gray-400 italic text-xs">Processed</span>'}
                </td>
            </tr>
        `).join('');

        console.log("Step 4: Rendering Complete.");

    } catch (err) {
        console.error("Step Error: Fetch failed:", err);
    }
}

async function handleAction(id, status) {
    try {
        const res = await fetch(`${API}/api/approvals/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status }),
            credentials: 'include'
        });
        
        if (res.ok) {
            fetchApprovals(); // Refresh table
        } else {
            alert('Failed to update status.');
        }
    } catch (err) {
        console.error(err);
    }
}