const API = 'http://127.0.0.1:3000';
let globalAssets = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchAssets();

    // Live Search
    const searchInput = document.getElementById('assetSearch');
    if (searchInput) {
        searchInput.addEventListener('input', applyAssetFilters);
    }

    // Add Asset Form Submit
    const addAssetForm = document.getElementById('addAssetForm');
    if (addAssetForm) {
        addAssetForm.addEventListener('submit', handleAddAsset);
    }

    // Show/Hide custom category input when "Other" is selected
    const categorySelect = document.getElementById('assetCategory');
    const customCategoryInput = document.getElementById('customCategory');
    
    if (categorySelect && customCategoryInput) {
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'Other') {
                customCategoryInput.classList.remove('hidden');
                customCategoryInput.required = true;
            } else {
                customCategoryInput.classList.add('hidden');
                customCategoryInput.required = false;
                customCategoryInput.value = ''; // Clear it out
            }
        });
    }
});

async function fetchAssets() {
    const tbody = document.getElementById('assets-table-body');
    
    try {
        const res = await fetch(`${API}/api/assets`, { 
            method: 'GET',
            credentials: 'include' 
        });

        if (res.status === 401) return window.location.href = 'login.html';
        if (!res.ok) throw new Error(`Server error: ${res.status}`);

        const assets = await res.json();
        globalAssets = assets;

        renderAssetTable(globalAssets);
    } catch (err) {
        console.error('Error loading assets:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-red-500">Failed to load IT Assets.</td></tr>`;
    }
}

function renderAssetTable(assetsToRender) {
    const tbody = document.getElementById('assets-table-body');
    if (!tbody) return;
    
    if (assetsToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-gray-400">No matching assets found.</td></tr>`;
        return;
    }

    tbody.innerHTML = assetsToRender.map(a => `
        <tr class="hover:bg-gray-50 transition border-b border-gray-50">
            <td class="px-6 py-4 font-mono text-sm font-semibold text-gray-900">${a.asset_id}</td>
            <td class="px-6 py-4">
                <p class="text-sm font-semibold text-gray-900">${a.name}</p>
                <p class="text-xs text-gray-500">${a.brand || 'N/A'} • SN: ${a.serial_number || 'N/A'}</p>
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">${a.category}</td>
            <td class="px-6 py-4">${getStatusBadge(a.status)}</td>
            <td class="px-6 py-4">${getHealthBadge(a.health_score)}</td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const colors = {
        'Available': 'bg-green-50 text-green-600 border-green-200',
        'Assigned': 'bg-purple-50 text-purple-600 border-purple-200',
        'Under Repair': 'bg-orange-50 text-orange-600 border-orange-200',
        'Retired': 'bg-gray-100 text-gray-600 border-gray-300'
    };
    const colorClass = colors[status] || 'bg-blue-50 text-blue-600 border-blue-200';
    return `<span class="px-2.5 py-1 ${colorClass} border rounded-md text-xs font-bold tracking-wide">${status || 'Available'}</span>`;
}

function getHealthBadge(health) {
    const colors = {
        'Excellent': 'text-green-500 bg-green-50',
        'Warning': 'text-yellow-600 bg-yellow-50',
        'Critical': 'text-red-600 bg-red-50'
    };
    const colorClass = colors[health] || 'text-gray-500 bg-gray-50';
    return `<span class="px-2 py-1 ${colorClass} rounded-md text-xs font-bold">${health || 'Unknown'}</span>`;
}

function applyAssetFilters() {
    const searchTerm = document.getElementById('assetSearch').value.toLowerCase();
    
    const filtered = globalAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm) || 
        asset.asset_id.toLowerCase().includes(searchTerm) ||
        (asset.serial_number && asset.serial_number.toLowerCase().includes(searchTerm))
    );
    renderAssetTable(filtered);
}

async function handleAddAsset(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    const selectedCategory = document.getElementById('assetCategory').value;
    const finalCategory = selectedCategory === 'Other' 
                          ? document.getElementById('customCategory').value 
                          : selectedCategory;

    const newAsset = {
        name: document.getElementById('assetName').value,
        category: finalCategory,
        brand: document.getElementById('assetBrand').value,
        serial_number: document.getElementById('assetSerial').value,
        status: 'Available',
        health_score: 'Excellent'
    };

    try {
        const res = await fetch(`${API}/api/assets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAsset),
            credentials: 'include'
        });

        if (res.ok) {
            toggleAssetModal(false);
            e.target.reset();
            // Reset custom category visibility manually after form reset
            document.getElementById('customCategory').classList.add('hidden');
            fetchAssets(); 
        } else {
            alert('Failed to add asset.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        submitBtn.textContent = 'Save Asset';
        submitBtn.disabled = false;
    }
}

function toggleAssetModal(show) {
    document.getElementById('addAssetModal').classList.toggle('hidden', !show);
}