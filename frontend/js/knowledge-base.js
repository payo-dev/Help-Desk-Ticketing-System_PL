const API = 'http://127.0.0.1:3000';
let globalArticles = []; 

document.addEventListener('DOMContentLoaded', () => {
    fetchArticles();
    document.getElementById('kbSearch').addEventListener('input', applyFilters);
    document.getElementById('kbCategoryFilter').addEventListener('change', applyFilters);
    
    const addForm = document.getElementById('addArticleForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddArticle);
    }
});

async function fetchArticles() {
    const grid = document.getElementById('kb-grid');
    try {
        const res = await fetch(`${API}/api/kb`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';
        
        globalArticles = await res.json();
        renderArticles(globalArticles);
    } catch (err) {
        console.error('Error fetching KB:', err);
    }
}

function renderArticles(articles) {
    const grid = document.getElementById('kb-grid');
    if (!grid) return;
    
    if (articles.length === 0) {
        grid.innerHTML = `<p class="text-gray-400 col-span-3 text-center py-10">No articles found.</p>`;
        return;
    }

    grid.innerHTML = articles.map(a => `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
            <span class="text-[10px] font-bold text-[#10b981] uppercase bg-green-50 px-2 py-1 rounded-md self-start">${a.category}</span>
            <h3 class="text-lg font-bold text-gray-900 mt-3 mb-2">${a.title}</h3>
            <p class="text-sm text-gray-500 mb-4 line-clamp-3">${a.content}</p>
            <button onclick="viewArticle(${a.id})" class="mt-auto text-indigo-600 font-bold text-sm hover:underline">Read full article →</button>
        </div>
    `).join('');
}

function applyFilters() {
    const search = document.getElementById('kbSearch').value.toLowerCase();
    const cat = document.getElementById('kbCategoryFilter').value;
    
    const filtered = globalArticles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(search) || a.content.toLowerCase().includes(search);
        const matchesCat = cat === 'all' || a.category === cat;
        return matchesSearch && matchesCat;
    });
    renderArticles(filtered);
}

// TOGGLE FUNCTION - FIXED NAME
function toggleAddModal(show) {
    const modal = document.getElementById('addModal');
    if (modal) modal.classList.toggle('hidden', !show);
}

function viewArticle(id) {
    const article = globalArticles.find(a => a.id === id);
    if (!article) return;
    document.getElementById('viewTitle').textContent = article.title;
    document.getElementById('viewContent').textContent = article.content;
    document.getElementById('viewModal').classList.remove('hidden');
}

async function handleAddArticle(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('kbTitle').value,
        category: document.getElementById('kbCategory').value,
        content: document.getElementById('kbContent').value
    };

    try {
        const res = await fetch(`${API}/api/kb`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
            credentials: 'include'
        });
        
        if (res.ok) {
            toggleAddModal(false); // Now matches your button correctly!
            e.target.reset();
            fetchArticles(); 
        } else {
            alert('Failed to save article.');
        }
    } catch (err) {
        console.error(err);
    }
}