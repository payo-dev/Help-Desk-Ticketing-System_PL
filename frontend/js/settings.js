const API = 'http://127.0.0.1:3000';

document.addEventListener('DOMContentLoaded', () => {
    const userString = localStorage.getItem('user');
    if (!userString) return window.location.href = 'login.html';

    fetchSettings();

    document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});

async function fetchSettings() {
    try {
        const res = await fetch(`${API}/api/settings`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';

        if (res.ok) {
            const settings = await res.json();
            
            if (settings.company_name) document.getElementById('company_name').value = settings.company_name;
            if (settings.support_email) document.getElementById('support_email').value = settings.support_email;
            if (settings.require_hardware_approval) document.getElementById('require_hardware_approval').value = settings.require_hardware_approval;
            if (settings.default_sla_hours) document.getElementById('default_sla_hours').value = settings.default_sla_hours;
        }
    } catch (err) {
        console.error("Error fetching settings:", err);
    }
}

async function saveSettings(e) {
    e.preventDefault();
    
    const btn = document.getElementById('saveBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Saving...`;
    btn.disabled = true;

    const data = {
        company_name: document.getElementById('company_name').value,
        support_email: document.getElementById('support_email').value,
        require_hardware_approval: document.getElementById('require_hardware_approval').value,
        default_sla_hours: document.getElementById('default_sla_hours').value
    };

    try {
        const res = await fetch(`${API}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const toast = document.getElementById('success-toast');
            toast.classList.remove('hidden');
            toast.classList.add('flex');
            setTimeout(() => { toast.classList.add('hidden'); toast.classList.remove('flex'); }, 3000);
        } else {
            alert('Failed to save settings.');
        }
    } catch (err) {
        console.error("Error saving settings:", err);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}