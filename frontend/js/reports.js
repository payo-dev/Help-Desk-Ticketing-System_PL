const API = 'http://127.0.0.1:3000'; 
let chartCat = null;
let chartStat = null;

document.addEventListener('DOMContentLoaded', () => {
    // Set official date for PDF
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('report-date').textContent = new Date().toLocaleDateString('en-US', options);
    
    fetchReportData();
});

async function fetchReportData() {
    try {
        const res = await fetch(`${API}/api/reports/summary`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';

        const data = await res.json();
        const total = data.metrics.total || 0;
        const open = data.metrics.open || 0;
        
        // 1. Populate UI elements
        document.getElementById('ui-metric-total').textContent = total;
        document.getElementById('ui-metric-open').textContent = open;
        renderCharts(data.charts.byCategory, data.charts.byStatus);

        // 2. Populate PDF elements
        document.getElementById('print-metric-total').textContent = total;
        document.getElementById('print-metric-open').textContent = open;
        renderTables(data.charts.byCategory, data.charts.byStatus);

    } catch (err) {
        console.error("Error loading reports:", err);
    }
}

// --- VISIBLE UI: CHARTS ---
function renderCharts(catData, statData) {
    if (chartCat) chartCat.destroy();
    if (chartStat) chartStat.destroy();

    const catLabels = catData.map(i => i.category || 'N/A');
    const catCounts = catData.map(i => i.count);
    
    chartCat = new Chart(document.getElementById('categoryChart'), {
        type: 'bar',
        data: {
            labels: catLabels,
            datasets: [{ data: catCounts, backgroundColor: '#10b981', borderRadius: 6 }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    const statLabels = statData.map(i => i.status);
    const statCounts = statData.map(i => i.count);

    chartStat = new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: statLabels,
            datasets: [{ data: statCounts, backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280'], borderWidth: 0 }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom' } } }
    });
}

// --- HIDDEN PDF: TABLES ---
function renderTables(catData, statData) {
    const cBody = document.getElementById('print-category-tbody');
    const sBody = document.getElementById('print-status-tbody');

    cBody.innerHTML = catData.map(item => `
        <tr>
            <td class="px-6 py-3 text-sm font-semibold text-gray-900">${item.category || 'Uncategorized'}</td>
            <td class="px-6 py-3 text-sm text-right text-gray-700 font-medium">${item.count}</td>
        </tr>
    `).join('');

    sBody.innerHTML = statData.map(item => `
        <tr>
            <td class="px-6 py-3 text-sm font-semibold text-gray-900">${item.status}</td>
            <td class="px-6 py-3 text-sm text-right text-gray-700 font-medium">${item.count}</td>
        </tr>
    `).join('');
}

// --- MAGIC EXPORT FUNCTION ---
function exportPDF() {
    const docElement = document.getElementById('pdf-document');
    
    // 1. Unhide the formal document
    docElement.classList.remove('hidden');

    const opt = {
        margin:       0.75,
        filename:     `HelpDesk_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // 2. Snap the PDF, then immediately re-hide the document
    html2pdf().set(opt).from(docElement).save().then(() => {
        docElement.classList.add('hidden');
    });
}