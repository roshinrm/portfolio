# AI Dev Hub - Portfolio & AI News Blog

A modern, responsive portfolio website combined with an AI tech blog that aggregates the latest AI news from multiple trusted sources.

## Features

### Portfolio Section
- **About Me**: Personal introduction and journey
- **Skills & Technologies**: Showcasing expertise in AI/ML, Web Development, and Cloud technologies
- **Contact Information**: Social links and email contact

### AI News Blog
- **Live News Feed**: Automatically fetches AI news from multiple RSS sources
- **Category Filtering**: Filter news by LLMs, Machine Learning, Computer Vision, and AI Ethics
- **Search Functionality**: Search through news articles by title and description
- **Caching**: Local storage caching to reduce API calls (1-hour cache)
- **Pagination**: Load more articles on demand
- **Article Preview**: Modal view with article details and link to original source

### Design Features
- **Warm Color Palette**: Cream/beige backgrounds with sage/mint green accents
- **Dark Mode**: Full dark mode support with toggle
- **Responsive Design**: Mobile-first approach with hamburger menu
- **Modern Typography**: Crimson Pro serif for headings, Inter sans-serif for body
- **Smooth Animations**: Card hover effects and smooth scrolling

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom styles with Tailwind CSS (CDN)
- **Vanilla JavaScript**: No frameworks, pure JS for news fetching
- **RSS2JSON API**: For converting RSS feeds to JSON
- **LocalStorage**: For caching news data

## News Sources

The blog aggregates AI news from:
- TechCrunch AI
- VentureBeat AI
- The Verge AI

## File Structure

```
/
├── index.html              # Main HTML file
├── src/
│   ├── css/
│   │   └── styles.css      # Legacy styles (unused)
│   ├── js/
│   │   └── news-fetcher.js # AI news fetching module
│   └── img/                # Image assets
├── README.md               # This file
├── LICENSE                 # License file
└── CNAME                   # Custom domain configuration
```

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/roshinrm/portfolio.git
   cd portfolio
   ```

2. **Open in browser**
   Simply open `index.html` in your web browser, or use a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`

3. **Deploy**
   The site is static and can be deployed to:
   - GitHub Pages
   - Netlify
   - Vercel
   - Any static hosting service

## How It Works

### News Fetching Process

1. **On Page Load**: The news fetcher checks localStorage for cached news
2. **Cache Check**: If cache exists and is less than 1 hour old, use cached data
3. **API Request**: If no cache or expired, fetch from RSS feeds via RSS2JSON API
4. **Processing**: 
   - Categorize articles based on keywords
   - Remove duplicates
   - Sort by publication date
5. **Display**: Render articles in a responsive grid with filtering options
6. **Caching**: Store fetched data in localStorage with timestamp

### Categorization Logic

Articles are automatically categorized based on keywords in title/description:
- **LLMs**: gpt, llm, language model, chatbot, chatgpt
- **Computer Vision**: computer vision, image recognition, opencv, visual
- **AI Ethics**: ethics, bias, responsible, fairness
- **Machine Learning**: machine learning, neural network, deep learning, model (default)

## Customization

### Update News Sources

Edit `src/js/news-fetcher.js` and modify the `RSS_FEEDS` array:

```javascript
const RSS_FEEDS = [
  'https://techcrunch.com/tag/artificial-intelligence/feed/',
  'https://venturebeat.com/category/ai/feed/',
  // Add more RSS feeds here
];
```

### Change Colors

Update the Tailwind config in `index.html`:

```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        sage: "#8BA888",    // Your accent color
        mint: "#A8D8B9",    // Light accent
        cream: "#F5F0E8",   // Background
        beige: "#E8F4F0",   // Alt background
      },
    },
  },
};
```

### Cache Duration

Modify the cache duration in `src/js/news-fetcher.js`:

```javascript
// Change 3600000 (1 hour) to your desired duration in milliseconds
if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 3600000) {
  // Use cached data
}
```

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## API Limitations

The RSS2JSON API (free tier) has limitations:
- Rate limiting may apply
- Some feeds may be blocked by CORS
- Consider upgrading to a paid plan for production use

## Future Enhancements

- [ ] Newsletter subscription functionality
- [ ] User authentication for personalized feeds
- [ ] Bookmark/save articles feature
- [ ] Social sharing buttons
- [ ] Comments section
- [ ] Backend API for better news aggregation
- [ ] Advanced search with filters
- [ ] Analytics integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

**Your Name**
- GitHub: [@roshinrm](https://github.com/roshinrm)
- Portfolio: [https://roshinrm.github.io/portfolio](https://roshinrm.github.io/portfolio)

## Acknowledgments

- News content sourced from respective publishers
- Icons from Remix Icon
- Fonts from Google Fonts
- Images from Unsplash

---

Built with ❤️ for the AI development community
