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
    <article class="bg-white dark:bg-charcoal rounded-xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-card-hover transition-all duration-300 minimal-card">
      <div class="relative overflow-hidden">
        <img src="${sanitizeURL(article.image)}" alt="${sanitizeHTML(article.title)}" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 article-image"/>
        <div class="absolute top-3 left-3">
          <span class="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">${sanitizeHTML(getCategoryName(article.category))}</span>
        </div>
      </div>
      <div class="p-6">
        <div class="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span class="font-medium text-blue-600 dark:text-blue-400">${sanitizeHTML(article.source)}</span>
          <span>•</span>
          <span>${sanitizeHTML(formatDate(article.pubDate))}</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">${sanitizeHTML(article.title)}</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          ${sanitizeHTML(article.description)}
        </p>
        <a href="${sanitizeURL(article.link)}" target="_blank" rel="noopener noreferrer" 
           class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm">
          Read Full Article 
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    </article>
  `).join('');

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
      btn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
      btn.classList.add('bg-blue-600', 'text-white');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
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
