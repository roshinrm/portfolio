/**
 * AI News Fetcher Module
 * Fetches and displays AI news from multiple RSS feeds using RSS2JSON API
 */

// Configuration constants
const CACHE_DURATION_MS = 3600000; // 1 hour
const DESCRIPTION_MAX_LENGTH = 150;
const NEWS_PER_PAGE = 9;

// RSS feed sources for AI news
const RSS_FEEDS = [
  'https://techcrunch.com/tag/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
];

let allNews = [];
let displayedNews = [];
let currentFilter = 'all';
let currentPage = 1;

/**
 * Strip HTML tags from string safely
 * Uses DOM parser for robust HTML removal
 */
function stripHTML(str) {
  const temp = document.createElement('div');
  temp.innerHTML = str;
  return temp.textContent || temp.innerText || '';
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Validate and sanitize URL
 */
function sanitizeURL(url) {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
  } catch (e) {
    // Invalid URL
  }
  // Return safe fallback
  return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop';
}

/**
 * Safely extract hostname from URL
 */
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return 'Unknown Source';
  }
}

/**
 * Categorize articles based on keywords in title and description
 */
function categorizeArticle(title, description) {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('gpt') || content.includes('llm') || content.includes('language model') || 
      content.includes('chatbot') || content.includes('chatgpt')) {
    return 'llm';
  } else if (content.includes('computer vision') || content.includes('image recognition') || 
             content.includes('opencv') || content.includes('visual')) {
    return 'vision';
  } else if (content.includes('ethics') || content.includes('bias') || 
             content.includes('responsible') || content.includes('fairness')) {
    return 'ethics';
  } else if (content.includes('machine learning') || content.includes('neural network') || 
             content.includes('deep learning') || content.includes('model')) {
    return 'ml';
  }
  
  return 'ml'; // default category
}

/**
 * Fetch AI news from RSS feeds
 */
async function fetchAINews() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const newsGrid = document.getElementById('newsGrid');
  
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  newsGrid.classList.add('hidden');

  try {
    // Check cache first (cache for 1 hour)
    const cachedData = localStorage.getItem('aiNewsCache');
    const cacheTime = localStorage.getItem('aiNewsCacheTime');
    const now = new Date().getTime();
    
    if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION_MS) {
      try {
        allNews = JSON.parse(cachedData);
        displayNews();
        return;
      } catch (parseError) {
        // Invalid cached data, fetch fresh
        console.warn('Invalid cached data, fetching fresh news');
      }
    }

    // Fetch from multiple RSS feeds using RSS2JSON API
    const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';
    const promises = RSS_FEEDS.map(feed => 
      fetch(RSS2JSON_API + encodeURIComponent(feed))
        .then(res => res.json())
        .catch(err => ({ status: 'error', items: [] }))
    );

    const results = await Promise.all(promises);
    
    allNews = [];
    results.forEach(result => {
      if (result.status === 'ok' && result.items) {
        result.items.forEach(item => {
          const category = categorizeArticle(item.title || '', item.description || '');
          const link = item.link || '#';
          allNews.push({
            title: item.title || 'Untitled',
            description: item.description ? stripHTML(item.description).substring(0, DESCRIPTION_MAX_LENGTH) + '...' : 'No description available',
            link: link,
            pubDate: item.pubDate || new Date().toISOString(),
            source: item.author || getHostname(link),
            image: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
            category: category
          });
        });
      }
    });

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // Remove duplicates by title
    const seen = new Set();
    allNews = allNews.filter(article => {
      if (seen.has(article.title)) return false;
      seen.add(article.title);
      return true;
    });

    // Cache the results
    localStorage.setItem('aiNewsCache', JSON.stringify(allNews));
    localStorage.setItem('aiNewsCacheTime', now.toString());

    displayNews();
  } catch (error) {
    console.error('Error fetching news:', error);
    loadingState.classList.add('hidden');
    errorState.classList.remove('hidden');
  }
}

/**
 * Display news articles in the grid
 */
function displayNews() {
  const loadingState = document.getElementById('loadingState');
  const newsGrid = document.getElementById('newsGrid');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  loadingState.classList.add('hidden');

  // Filter news by category
  displayedNews = currentFilter === 'all' 
    ? allNews 
    : allNews.filter(article => article.category === currentFilter);

  // Apply search filter
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (searchTerm) {
    displayedNews = displayedNews.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.description.toLowerCase().includes(searchTerm)
    );
  }

  // Paginate
  const paginatedNews = displayedNews.slice(0, currentPage * NEWS_PER_PAGE);

  // Update last updated time
  const cacheTime = localStorage.getItem('aiNewsCacheTime');
  if (cacheTime) {
    const date = new Date(parseInt(cacheTime));
    lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
  }

  // Render news cards
  newsGrid.innerHTML = paginatedNews.map((article, index) => `
    <article class="bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" data-article-index="${index}">
      <div class="relative overflow-hidden">
        <img src="${sanitizeURL(article.image)}" alt="${sanitizeHTML(article.title)}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 article-image"/>
        <div class="absolute top-3 left-3">
          <span class="px-3 py-1 bg-sage text-white text-xs font-medium rounded-full">${sanitizeHTML(getCategoryName(article.category))}</span>
        </div>
      </div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span>${sanitizeHTML(formatDate(article.pubDate))}</span>
          <span>•</span>
          <span class="truncate">${sanitizeHTML(article.source)}</span>
        </div>
        <h3 class="font-serif font-semibold text-primary dark:text-white mb-2 line-clamp-2 group-hover:text-sage dark:group-hover:text-mint transition-colors">${sanitizeHTML(article.title)}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 mb-4">
          ${sanitizeHTML(article.description)}
        </p>
        <div class="flex items-center justify-between">
          <span class="text-sm text-sage font-medium">Read more →</span>
        </div>
      </div>
    </article>
  `).join('');

  // Add click event listeners to article cards
  newsGrid.querySelectorAll('article').forEach((card, index) => {
    card.addEventListener('click', () => {
      openArticleModal(paginatedNews[index]);
    });
  });

  // Add error handlers to images
  newsGrid.querySelectorAll('.article-image').forEach(img => {
    img.addEventListener('error', function() {
      this.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop';
    });
  });

  newsGrid.classList.remove('hidden');

  // Show/hide load more button
  if (paginatedNews.length < displayedNews.length) {
    loadMoreContainer.classList.remove('hidden');
  } else {
    loadMoreContainer.classList.add('hidden');
  }
}

/**
 * Get human-readable category name
 */
function getCategoryName(category) {
  const names = {
    'llm': 'LLMs',
    'ml': 'Machine Learning',
    'vision': 'Computer Vision',
    'ethics': 'AI Ethics'
  };
  return names[category] || 'AI News';
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Filter news by category
 */
function filterNews(category) {
  currentFilter = category;
  currentPage = 1;
  
  // Update button styles
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
      btn.classList.add('bg-sage', 'text-white');
    } else {
      btn.classList.remove('bg-sage', 'text-white');
      btn.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
    }
  });
  
  displayNews();
}

/**
 * Search news articles
 */
function searchNews() {
  currentPage = 1;
  displayNews();
}

/**
 * Load more news articles
 */
function loadMoreNews() {
  currentPage++;
  displayNews();
}

/**
 * Open article modal with details
 */
function openArticleModal(article) {
  const modalTitle = document.getElementById("modalTitle");
  const modalMeta = document.getElementById("modalMeta");
  const modalImage = document.getElementById("modalImage");
  const modalContentText = document.getElementById("modalContentText");
  const modalLink = document.getElementById("modalLink");
  const articleModal = document.getElementById("articleModal");

  // Safely set content using textContent where possible
  modalTitle.textContent = article.title;
  
  // Build meta info safely
  const metaSpan = document.createElement('span');
  metaSpan.className = 'px-2 py-0.5 bg-sage/10 text-sage rounded';
  metaSpan.textContent = getCategoryName(article.category);
  modalMeta.textContent = '';
  modalMeta.appendChild(document.createTextNode(`${formatDate(article.pubDate)} • ${article.source} • `));
  modalMeta.appendChild(metaSpan);
  
  // Set image with error handling
  const img = document.createElement('img');
  img.src = sanitizeURL(article.image);
  img.alt = article.title;
  img.className = 'w-full rounded-xl';
  img.addEventListener('error', function() { 
    this.src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop';
  });
  modalImage.textContent = '';
  modalImage.appendChild(img);
  
  // Set content safely
  const contentP = document.createElement('p');
  contentP.className = 'text-base leading-relaxed';
  contentP.textContent = `${article.description.replace('...', '')} This is a preview from ${article.source}. Click below to read the full article on their website.`;
  modalContentText.textContent = '';
  modalContentText.appendChild(contentP);
  
  modalLink.href = sanitizeURL(article.link);

  articleModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/**
 * Close article modal
 */
function closeArticleModal() {
  const articleModal = document.getElementById("articleModal");
  articleModal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Initialize: Fetch news on page load
window.addEventListener('DOMContentLoaded', () => {
  // Setup filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterNews(btn.dataset.category);
    });
  });

  // Setup search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', searchNews);
  }

  // Setup load more button
  const loadMoreBtn = document.querySelector('[data-action="load-more"]');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreNews);
  }

  // Setup retry button
  const retryBtn = document.querySelector('[data-action="retry"]');
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchAINews);
  }

  // Setup hero buttons
  const blogBtn = document.querySelector('[data-scroll="blog"]');
  if (blogBtn) {
    blogBtn.addEventListener('click', () => {
      document.getElementById('blog')?.scrollIntoView({behavior: 'smooth'});
    });
  }

  const aboutBtn = document.querySelector('[data-scroll="about"]');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      document.getElementById('about')?.scrollIntoView({behavior: 'smooth'});
    });
  }

  // Setup modal close button
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeArticleModal);
  }

  // Close modal when clicking outside
  const articleModal = document.getElementById('articleModal');
  if (articleModal) {
    articleModal.addEventListener('click', (e) => {
      if (e.target === articleModal) {
        closeArticleModal();
      }
    });
  }

  // Prevent modal content clicks from closing modal
  const modalContent = document.getElementById('modalContent');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Setup mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Fetch initial news
  fetchAINews();
});
