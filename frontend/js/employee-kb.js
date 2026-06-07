const API = 'http://127.0.0.1:3000';
let globalArticles = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchArticles();
  document.getElementById('kbSearch').addEventListener('input', applyFilters);
  document.getElementById('kbCategoryFilter').addEventListener('change', applyFilters);
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

function renderArticles(articles) {
  const grid = document.getElementById('kb-grid');
  const empty = document.getElementById('kb-empty');
  const banner = document.getElementById('kb-help-banner');
  if (!grid) return;

  if (articles.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    banner.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  banner.classList.remove('hidden');

  const categoryColors = {
    Hardware:  'text-orange-600 bg-orange-50',
    Software:  'text-blue-600 bg-blue-50',
    Network:   'text-purple-600 bg-purple-50',
    HR:        'text-pink-600 bg-pink-50',
    Finance:   'text-yellow-600 bg-yellow-50',
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
          Read full article →
        </button>
      </div>
    `;
  }).join('');
}

function applyFilters() {
  const search = document.getElementById('kbSearch').value.toLowerCase();
  const cat = document.getElementById('kbCategoryFilter').value;

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

  const categoryColors = {
    Hardware:  'text-orange-600 bg-orange-50',
    Software:  'text-blue-600 bg-blue-50',
    Network:   'text-purple-600 bg-purple-50',
    HR:        'text-pink-600 bg-pink-50',
    Finance:   'text-yellow-600 bg-yellow-50',
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
  document.getElementById('viewModal').classList.add('hidden');
}

// Close modal on backdrop click
window.onclick = function(e) {
  if (e.target === document.getElementById('viewModal')) closeViewModal();
};