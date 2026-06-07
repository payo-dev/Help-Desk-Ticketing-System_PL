const API = 'http://127.0.0.1:3000';
let globalMaintenance = [];
let currentTab = 'Scheduled'; 

document.addEventListener('DOMContentLoaded', () => {
    fetchMaintenanceRecords();
    populateAssetDropdown(); 

    const searchInput = document.getElementById('maintenanceSearch');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    const scheduleForm = document.getElementById('scheduleMaintenanceForm');
    if (scheduleForm) scheduleForm.addEventListener('submit', handleScheduleSubmit);

    const editForm = document.getElementById('editMaintenanceForm');
    if (editForm) editForm.addEventListener('submit', handleEditSubmit);
});

function switchTab(tabName) {
    currentTab = tabName;
    const btnScheduled = document.getElementById('tab-scheduled');
    const btnCompleted = document.getElementById('tab-completed');

    if (tabName === 'Scheduled') {
        btnScheduled.className = "pb-3 text-sm font-bold text-[#10b981] border-b-2 border-[#10b981] transition";
        btnCompleted.className = "pb-3 text-sm font-bold text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition";
    } else {
        btnCompleted.className = "pb-3 text-sm font-bold text-[#10b981] border-b-2 border-[#10b981] transition";
        btnScheduled.className = "pb-3 text-sm font-bold text-gray-400 hover:text-gray-600 border-b-2 border-transparent transition";
    }
    applyFilters(); 
}

async function fetchMaintenanceRecords() {
    try {
        const res = await fetch(`${API}/api/maintenance`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        globalMaintenance = await res.json();
        applyFilters(); 
    } catch (err) { console.error('Error:', err); }
}

async function populateAssetDropdown() {
    const dropdown = document.getElementById('maintAssetId');
    try {
        const res = await fetch(`${API}/api/assets`, { credentials: 'include' });
        if (!res.ok) return;
        const assets = await res.json();
        dropdown.innerHTML = '<option value="" disabled selected>Select an asset...</option>';
        assets.forEach(asset => {
            dropdown.innerHTML += `<option value="${asset.id}">${asset.asset_id} - ${asset.name}</option>`;
        });
    } catch (err) {}
}

function renderTable(recordsToRender) {
    const tbody = document.getElementById('maintenance-table-body');
    if (!tbody) return;
    
    if (recordsToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No tasks found in this section.</td></tr>`;
        return;
    }

    tbody.innerHTML = recordsToRender.map(r => {
        const dateToShow = r.status === 'Completed' && r.completed_date ? r.completed_date : r.scheduled_date;
        const niceDate = new Date(dateToShow).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Check if the record is completed to render a different button
        const isCompleted = r.status === 'Completed';
        const actionBtn = isCompleted 
            ? `<button onclick="openEditModal(${r.id}, 'view')" class="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:text-blue-800 font-bold text-sm transition">View Details</button>`
            : `<button onclick="openEditModal(${r.id}, 'edit')" class="text-[#10b981] bg-green-50 px-3 py-1.5 rounded-lg hover:text-[#059669] font-bold text-sm transition">Edit</button>`;

        return `
        <tr class="hover:bg-gray-50 transition border-b border-gray-50">
            <td class="px-6 py-4 font-mono text-sm font-semibold text-gray-900">${niceDate}</td>
            <td class="px-6 py-4">
                <p class="text-sm font-semibold text-gray-900">${r.asset_name || 'Deleted Asset'}</p>
                <p class="text-xs text-gray-500">${r.asset_tag || ''}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">${r.maintenance_type}</td>
            <td class="px-6 py-4">${getStatusBadge(r.status)}</td>
            <td class="px-6 py-4">${actionBtn}</td>
        </tr>
    `}).join('');
}

function getStatusBadge(status) {
    const colors = {
        'Scheduled': 'bg-blue-50 text-blue-600 border-blue-200',
        'Completed': 'bg-green-50 text-green-600 border-green-200',
        'Overdue': 'bg-red-50 text-red-600 border-red-200'
    };
    const colorClass = colors[status] || 'bg-gray-50 text-gray-600';
    return `<span class="px-2.5 py-1 ${colorClass} border rounded-md text-xs font-bold tracking-wide">${status || 'Scheduled'}</span>`;
}

function applyFilters() {
    const searchTerm = document.getElementById('maintenanceSearch').value.toLowerCase();
    const filtered = globalMaintenance.filter(r => {
        const matchesSearch = (r.asset_name && r.asset_name.toLowerCase().includes(searchTerm)) || 
                              (r.asset_tag && r.asset_tag.toLowerCase().includes(searchTerm)) ||
                              r.maintenance_type.toLowerCase().includes(searchTerm);
        
        const matchesTab = currentTab === 'Completed' ? r.status === 'Completed' : r.status !== 'Completed';
        return matchesSearch && matchesTab;
    });
    renderTable(filtered);
}

function toggleMaintenanceModal(show) {
    document.getElementById('scheduleMaintenanceModal').classList.toggle('hidden', !show);
}

function toggleEditModal(show) {
    document.getElementById('editMaintenanceModal').classList.toggle('hidden', !show);
}

// SMART MODAL: Accepts a 'mode' parameter to lock fields if 'view'
function openEditModal(recordId, mode) {
    const record = globalMaintenance.find(r => r.id === recordId);
    if (!record) return;

    const isViewOnly = mode === 'view';

    // Toggle Modal Text and Button Visibility
    document.getElementById('editModalTitle').textContent = isViewOnly ? 'Task Details' : 'Update Task Status';
    const saveBtn = document.getElementById('editSaveBtn');
    if (isViewOnly) saveBtn.classList.add('hidden');
    else saveBtn.classList.remove('hidden');

    // Fill Data
    document.getElementById('editRecordId').value = record.id;
    document.getElementById('editAssetName').textContent = `${record.asset_tag} - ${record.asset_name}`;
    document.getElementById('editTaskType').textContent = record.maintenance_type;
    document.getElementById('editStatus').value = record.status;
    document.getElementById('editDescription').value = record.description || '';
    document.getElementById('editCost').value = record.cost || '';

    if (record.completed_date) {
        document.getElementById('editCompletedDate').value = new Date(record.completed_date).toISOString().split('T')[0];
    } else {
        document.getElementById('editCompletedDate').value = new Date().toISOString().split('T')[0];
    }

    // Lock or unlock fields based on mode
    document.getElementById('editStatus').disabled = isViewOnly;
    document.getElementById('editCompletedDate').disabled = isViewOnly;
    document.getElementById('editCost').disabled = isViewOnly;
    document.getElementById('editDescription').disabled = isViewOnly;

    toggleEditModal(true);
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Saving...'; btn.disabled = true;

    const newTask = {
        asset_id: document.getElementById('maintAssetId').value,
        maintenance_type: document.getElementById('maintType').value,
        scheduled_date: document.getElementById('maintDate').value,
        description: document.getElementById('maintDescription').value
    };

    try {
        const res = await fetch(`${API}/api/maintenance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask),
            credentials: 'include'
        });
        if (res.ok) {
            toggleMaintenanceModal(false); e.target.reset(); fetchMaintenanceRecords();
        } else alert('Failed to schedule maintenance.');
    } catch (err) { console.error(err); } 
    finally { btn.textContent = 'Schedule Task'; btn.disabled = false; }
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Updating...'; btn.disabled = true;

    const recordId = document.getElementById('editRecordId').value;
    const updatedData = {
        status: document.getElementById('editStatus').value,
        completed_date: document.getElementById('editCompletedDate').value || null,
        cost: document.getElementById('editCost').value || 0,
        description: document.getElementById('editDescription').value
    };

    try {
        const res = await fetch(`${API}/api/maintenance/${recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });
        
        if (res.ok) {
            toggleEditModal(false);
            fetchMaintenanceRecords(); 
        } else {
            alert('Failed to update record.');
        }
    } catch (err) { console.error(err); } 
    finally { btn.textContent = 'Save Changes'; btn.disabled = false; }
}

window.onclick = function(event) {
    const maintModal = document.getElementById('scheduleMaintenanceModal');
    const editModal = document.getElementById('editMaintenanceModal');
    if (event.target === maintModal) toggleMaintenanceModal(false);
    if (event.target === editModal) toggleEditModal(false);
}