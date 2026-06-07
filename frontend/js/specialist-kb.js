const API = 'http://127.0.0.1:3000';
let globalArticles = [];
let currentArticleId = null;

document.addEventListener('DOMContentLoaded', () => {
  fetchArticles();
  fetchActiveTickets();
  document.getElementById('kbSearch').addEventListener('input', applyFilters);
  document.getElementById('kbCategoryFilter').addEventListener('change', applyFilters);
  document.getElementById('kbDeptFilter').addEventListener('change', applyFilters);
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

async function fetchActiveTickets() {
  try {
    const res = await fetch(`${API}/api/tickets/queue/specialist`, { credentials: 'include' });
    if (res.status === 401) return;
    if (!res.ok) throw new Error('Failed to load tickets');
    
    const data = await res.json();
    const myTickets = data.myTickets || [];
    
    const select = document.getElementById('resolve-ticket-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select your active ticket...</option>';
    myTickets.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = `${t.ticket_number} - ${t.title}`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error fetching tickets:', err);
  }
}

function renderArticles(articles) {
  const grid = document.getElementById('kb-grid');
  const empty = document.getElementById('kb-empty');
  if (!grid) return;

  if (articles.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  const categoryColors = {
    Hardware:  'text-orange-600 bg-orange-50',
    Software:  'text-blue-600 bg-blue-50',
    Network:   'text-purple-600 bg-purple-50',
    HR:        'text-pink-600 bg-pink-50',
    Finance:   'text-yellow-600 bg-yellow-50',
    Facilities:'text-teal-600 bg-teal-50',
    Procurement:'text-indigo-600 bg-indigo-50',
    General:   'text-gray-600 bg-gray-100',
  };

  grid.innerHTML = articles.map(a => {
    const colorClass = categoryColors[a.category] || 'text-[#10b981] bg-green-50';
    return `
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
        <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-md self-start ${colorClass}">${a.category}</span>
        <h3 class="text-base font-bold text-gray-900 mt-3 mb-2">${a.title}</h3>
        <p class="text-sm text-gray-500 mb-4 line-clamp-3">${a.content}</p>
        <button onclick="viewArticle(${a.id})"
          class="mt-auto text-[#10b981] font-bold text-sm hover:underline text-left">
          Read full article &rarr;
        </button>
      </div>
    `;
  }).join('');
}

function applyFilters() {
  const search = document.getElementById('kbSearch').value.toLowerCase();
  const cat = document.getElementById('kbCategoryFilter').value;
  // kbDeptFilter currently acts mostly as a UI concept, 
  // you might need server-side filtering or mapped categories for strict "My Department".
  // For now, we filter by category and search term.

  const filtered = globalArticles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search) ||
                          a.content.toLowerCase().includes(search);
    const matchesCat = cat === 'all' || a.category === cat;
    return matchesSearch && matchesCat;
  });

  renderArticles(filtered);
}

function viewArticle(id) {
  const article = globalArticles.find(a => a.id === id);
  if (!article) return;
  
  currentArticleId = id;

  const categoryColors = {
    Hardware:  'text-orange-600 bg-orange-50',
    Software:  'text-blue-600 bg-blue-50',
    Network:   'text-purple-600 bg-purple-50',
    HR:        'text-pink-600 bg-pink-50',
    Finance:   'text-yellow-600 bg-yellow-50',
    Facilities:'text-teal-600 bg-teal-50',
    Procurement:'text-indigo-600 bg-indigo-50',
    General:   'text-gray-600 bg-gray-100',
  };
  const colorClass = categoryColors[article.category] || 'text-[#10b981] bg-green-50';

  document.getElementById('viewTitle').textContent = article.title;
  document.getElementById('viewContent').textContent = article.content;

  const catEl = document.getElementById('viewCategory');
  catEl.textContent = article.category;
  catEl.className = `text-[10px] font-bold uppercase px-2 py-1 rounded-md ${colorClass}`;

  document.getElementById('viewModal').classList.remove('hidden');
}

function closeViewModal() {
  currentArticleId = null;
  document.getElementById('viewModal').classList.add('hidden');
  document.getElementById('resolve-ticket-select').value = '';
}

function toggleSuggestModal(show) {
  const modal = document.getElementById('suggestModal');
  if (show) {
    document.getElementById('suggestForm').reset();
    document.getElementById('suggest-error').classList.add('hidden');
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}

async function submitSuggestion() {
  const title = document.getElementById('suggestTitle').value.trim();
  const category = document.getElementById('suggestCategory').value;
  const content = document.getElementById('suggestContent').value.trim();
  const errorEl = document.getElementById('suggest-error');

  if (!title || !content) {
    errorEl.textContent = 'Please fill out all required fields.';
    errorEl.classList.remove('hidden');
    return;
  }

  // NOTE: If the backend restricts POST /api/kb to Admin (role_id 1), this may return 403.
  // In a complete system, there should be a suggestion table or a draft status.
  try {
    const res = await fetch(`${API}/api/kb/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, content }),
      credentials: 'include'
    });

    if (res.status === 401) return window.location.href = 'login.html';
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to submit suggestion.');
    }

    toggleSuggestModal(false);
    showToast('Suggestion submitted successfully!');
    fetchArticles();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  }
}

async function resolveWithArticle() {
  const ticketId = document.getElementById('resolve-ticket-select').value;
  if (!ticketId) {
    alert('Please select an active ticket first.');
    return;
  }

  try {
    const res = await fetch(`${API}/api/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Resolved' }),
      credentials: 'include'
    });

    if (res.status === 401) return window.location.href = 'login.html';
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to resolve ticket.');
    }

    closeViewModal();
    showToast('Ticket marked as Resolved!');
    
    // Remove the resolved ticket from the dropdown
    fetchActiveTickets();
  } catch (err) {
    alert('Error resolving ticket: ' + err.message);
  }
}

function showToast(msg) {
  const toast = document.getElementById('success-toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('flex');
  
  setTimeout(() => {
    toast.classList.add('hidden');
    toast.classList.remove('flex');
  }, 3000);
}

// Close modals on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('viewModal')) closeViewModal();
  if (e.target === document.getElementById('suggestModal')) toggleSuggestModal(false);
};
