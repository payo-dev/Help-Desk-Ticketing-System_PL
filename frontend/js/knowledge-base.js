const API = 'http://127.0.0.1:3000';
let globalArticles = []; 
let globalSuggestions = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchArticles();
    fetchSuggestions();
    document.getElementById('kbSearch').addEventListener('input', applyFilters);
    document.getElementById('kbCategoryFilter').addEventListener('change', applyFilters);
    
    const addForm = document.getElementById('addArticleForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddArticle);
    }
});

async function fetchArticles() {
    try {
        const res = await fetch(`${API}/api/kb`, { credentials: 'include' });
        if (res.status === 401) return window.location.href = 'login.html';
        
        globalArticles = await res.json();
        renderArticles(globalArticles);
    } catch (err) {
        console.error('Error fetching KB:', err);
    }
}

async function fetchSuggestions() {
    try {
        const res = await fetch(`${API}/api/kb/suggestions`, { credentials: 'include' });
        if (res.status === 401) return;
        
        globalSuggestions = await res.json();
        renderSuggestions(globalSuggestions);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
    }
}

function renderSuggestions(suggestions) {
    const section = document.getElementById('suggestions-section');
    const grid = document.getElementById('suggestions-grid');
    if (!section || !grid) return;
    
    if (suggestions.length === 0) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');

    grid.innerHTML = suggestions.map(s => `
        <div class="bg-yellow-50 p-6 rounded-2xl shadow-sm border border-yellow-200 flex flex-col">
            <span class="text-[10px] font-bold text-yellow-700 uppercase bg-yellow-200 px-2 py-1 rounded-md self-start">${s.category}</span>
            <h3 class="text-lg font-bold text-gray-900 mt-3 mb-2">${s.title}</h3>
            <p class="text-sm text-gray-600 mb-4 line-clamp-3">${s.content}</p>
            <div class="mt-auto flex gap-2">
                <button onclick="approveSuggestion(${s.id})" class="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 rounded-xl text-sm font-bold transition">Approve</button>
                <button onclick="rejectSuggestion(${s.id})" class="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-xl text-sm font-bold transition">Reject</button>
            </div>
        </div>
    `).join('');
}

async function approveSuggestion(id) {
    try {
        const res = await fetch(`${API}/api/kb/${id}/approve`, {
            method: 'PUT',
            credentials: 'include'
        });
        if (res.ok) {
            fetchArticles();
            fetchSuggestions();
        } else {
            alert('Failed to approve suggestion.');
        }
    } catch (err) {
        console.error(err);
    }
}

async function rejectSuggestion(id) {
    if (!confirm('Are you sure you want to reject and delete this suggestion?')) return;
    try {
        const res = await fetch(`${API}/api/kb/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            fetchSuggestions();
        } else {
            alert('Failed to reject suggestion.');
        }
    } catch (err) {
        console.error(err);
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
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col relative">
            <button onclick="deleteArticle(${a.id})" class="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <span class="text-[10px] font-bold text-[#10b981] uppercase bg-green-50 px-2 py-1 rounded-md self-start">${a.category}</span>
            <h3 class="text-lg font-bold text-gray-900 mt-3 mb-2">${a.title}</h3>
            <p class="text-sm text-gray-500 mb-4 line-clamp-3">${a.content}</p>
            <button onclick="viewArticle(${a.id})" class="mt-auto text-indigo-600 font-bold text-sm hover:underline text-left">Read full article &rarr;</button>
        </div>
    `).join('');
}

async function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
        const res = await fetch(`${API}/api/kb/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            fetchArticles();
        } else {
            alert('Failed to delete article.');
        }
    } catch (err) {
        console.error(err);
    }
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