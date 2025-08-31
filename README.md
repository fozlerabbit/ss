# ScriptySphere Website

A modern, bilingual (English/Bengali) static website for ScriptySphere - a youth-driven organization advancing technology, education, and social development in Bangladesh.

## 🌟 Features

### Core Functionality
- **Fully Static**: HTML, CSS, and vanilla JavaScript - no frameworks required
- **Bilingual Support**: English and Bengali with seamless language switching
- **Responsive Design**: Mobile-first approach with fluid layouts
- **Dark/Light Theme**: System preference detection with manual override
- **PWA Ready**: Installable with offline functionality
- **High Performance**: Optimized for Lighthouse scores 95+

### Advanced Features
- **Modular Architecture**: Reusable partials system for maintainability
- **Client-side Search**: Fuzzy search with Fuse.js
- **Members Directory**: Advanced filtering by location, role, and skills
- **Accessibility**: WCAG 2.2 AA compliant with keyboard navigation
- **SEO Optimized**: Meta tags, structured data, and sitemap
- **Cookie Consent**: GDPR-compliant privacy controls

## 🏗️ Project Structure

```
scriptysphere-website/
├── index.html                 # Homepage
├── about/index.html          # About page
├── programmes/index.html     # Programmes listing
├── impact/index.html         # Impact metrics
├── members/index.html        # Members directory
├── blog/index.html           # Blog listing
├── resources/index.html      # Downloads & resources
├── community/index.html      # Join community
├── contact/index.html        # Contact form
├── privacy.html              # Privacy policy
├── terms.html               # Terms of service
├── 404.html                 # Error page
├── offline.html             # Offline fallback
├── partials/                # Reusable components
│   ├── header.html
│   ├── nav.html
│   ├── footer.html
│   ├── cookie.html
│   ├── cta.html
│   └── modal.html
├── assets/                  # Static assets
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript modules
│   ├── img/                # Images and icons
│   ├── fonts/              # Web fonts
│   ├── data/               # JSON data files
│   └── i18n/               # Translation files
├── manifest.json           # PWA manifest
├── sitemap.xml            # Search engine sitemap
├── robots.txt             # Crawler instructions
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser
- Local web server (Python, Node.js, or similar)
- Text editor

### Development Setup

1. **Clone or download** the project files
2. **Start local server**:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open browser** to `http://localhost:8000`

### Production Build

1. **Install dependencies** (optional, for minification):
   ```bash
   npm install
   ```

2. **Build optimized version**:
   ```bash
   npm run build
   ```

3. **Deploy** to your preferred hosting platform

## 🎨 Customization

### Content Management

#### Adding New Members
1. Edit `/assets/data/members.json`
2. Add member object with required fields:
   ```json
   {
     "id": "SS202416",
     "name": "New Member Name",
     "role": "Role Title",
     "division": "Division Name",
     "district": "District Name",
     "upazila": "Upazila Name",
     "email": "email@example.com",
     "avatar": "/assets/img/members/avatar.webp",
     "bio": "Brief biography...",
     "skills": ["Skill1", "Skill2"],
     "joinedDate": "2024-12-01",
     "featured": false,
     "social": {
       "linkedin": "https://linkedin.com/in/username"
     }
   }
   ```

#### Updating Translations
1. Edit `/assets/i18n/en.json` for English text
2. Edit `/assets/i18n/bn.json` for Bengali text
3. Use nested keys for organization:
   ```json
   {
     "page": {
       "section": {
         "element": "Translated text"
       }
     }
   }
   ```

#### Adding Blog Posts
1. Create folder: `/blog/posts/YYYY-MM-title/`
2. Add `index.html` with article structure
3. Update `/assets/data/posts.json` with post metadata
4. Update search index if needed

### Styling Customization

#### Theme Colors
Edit CSS variables in `/assets/css/base.css`:
```css
:root {
  --color-primary: #2563eb;
  --color-secondary: #10b981;
  --color-accent: #f59e0b;
}
```

#### Typography
Update font families and sizes:
```css
:root {
  --font-family-base: 'Inter Variable', sans-serif;
  --font-family-bengali: 'Noto Sans Bengali Variable', sans-serif;
}
```

#### Components
Modify component styles in `/assets/css/components.css`

### JavaScript Functionality

#### Adding New Features
1. Create new module in `/assets/js/`
2. Import in relevant pages
3. Follow existing patterns for:
   - Event delegation
   - Error handling
   - Accessibility
   - Performance

#### Extending Search
1. Update `/assets/data/search-index.json`
2. Add new content types
3. Modify search.js for custom behavior

## 🌍 Internationalization (i18n)

### Language Support
- **English** (en): Primary language
- **Bengali** (bn): Secondary language with proper font support

### Adding New Languages
1. Create `/assets/i18n/[lang-code].json`
2. Update `i18n.js` to include new language
3. Add language option to header
4. Test thoroughly with new script/font requirements

### RTL Support
Currently configured for LTR languages. For RTL support:
1. Update `i18n.js` direction detection
2. Add RTL-specific CSS
3. Test layout adjustments

## 📱 PWA Features

### Service Worker
- **Caches static assets** for offline access
- **Background sync** for form submissions
- **Update notifications** for new content
- **Push notifications** support (optional)

### Installation
- **Automatic prompts** on supported browsers
- **Custom install button** available
- **App shortcuts** for quick access

## 🔧 Performance Optimization

### Images
- **WebP format** with fallbacks
- **Lazy loading** for non-critical images
- **Responsive images** with `<picture>` elements
- **Optimized dimensions** for different viewports

### Loading Strategy
- **Critical CSS** inlined or preloaded
- **JavaScript** loaded with `defer`
- **Fonts** preloaded for FOUT prevention
- **Service Worker** caching for repeat visits

### Bundle Size
- **No frameworks**: Vanilla JavaScript only
- **Modular CSS**: Load only what's needed
- **External CDNs**: For third-party libraries with fallbacks

## ♿ Accessibility

### WCAG 2.2 AA Compliance
- **Semantic HTML5** structure
- **ARIA labels** where appropriate
- **Keyboard navigation** for all interactive elements
- **Focus management** in modals and dropdowns
- **Color contrast** ratios meeting standards
- **Screen reader** compatibility

### Testing
```bash
# Install accessibility testing
npm install -g @axe-core/cli

# Run accessibility audit
npm run test-accessibility
```

## 🔍 SEO Optimization

### Technical SEO
- **Semantic markup** with proper heading hierarchy
- **Meta descriptions** for all pages
- **Open Graph** and Twitter Card tags
- **Canonical URLs** to prevent duplicates
- **Structured data** (JSON-LD) for rich snippets

### Content SEO
- **Bilingual content** with proper `hreflang`
- **Image alt texts** for accessibility and SEO
- **Internal linking** strategy
- **Sitemap.xml** for search engines

## 🚀 Deployment

### Netlify
1. **Connect repository** to Netlify
2. **Build settings**:
   - Build command: `npm run build` (optional)
   - Publish directory: `.` (root)
3. **Environment variables**: None required
4. **Custom domain**: Configure in Netlify dashboard

### Vercel
1. **Import project** from GitHub
2. **Framework preset**: Other
3. **Build command**: `npm run build` (optional)
4. **Output directory**: `.`
5. **Install command**: `npm install` (optional)

### GitHub Pages
1. **Enable GitHub Pages** in repository settings
2. **Source**: Deploy from branch
3. **Branch**: `main` or `gh-pages`
4. **Folder**: `/ (root)`

### Manual Deployment
1. **Upload files** via FTP/SFTP
2. **Ensure proper permissions** for all files
3. **Configure web server** for SPA routing (optional)

## 🧪 Testing

### Automated Testing
```bash
# Install testing dependencies
npm install

# Run all tests
npm test

# Individual test suites
npm run test-accessibility  # Accessibility audit
npm run test-lighthouse    # Performance audit
npm run validate-html      # HTML validation
```

### Manual Testing Checklist

#### Functionality
- [ ] All navigation links work
- [ ] Language switching functions correctly
- [ ] Theme toggle works in both languages
- [ ] Search functionality works
- [ ] Forms submit successfully
- [ ] Modals open and close properly
- [ ] Mobile menu functions correctly

#### Performance
- [ ] Lighthouse score 95+ on all metrics
- [ ] Images load progressively
- [ ] No console errors
- [ ] Fast initial paint
- [ ] Smooth animations (when motion not reduced)

#### Accessibility
- [ ] Keyboard navigation works throughout
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] Color contrast meets standards
- [ ] Forms properly labeled

#### Cross-browser
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## 🔒 Security

### Content Security Policy
Basic CSP implemented via meta tag. For production, consider:
- **Server-level CSP headers**
- **Nonce-based script loading**
- **Stricter source restrictions**

### Privacy
- **Cookie consent** system implemented
- **No tracking** without user consent
- **Local data storage** clearly documented
- **GDPR compliance** features included

## 📊 Analytics

### Privacy-Friendly Options
- **Plausible Analytics**: Lightweight, GDPR-compliant
- **GoatCounter**: Simple, privacy-focused
- **Self-hosted solutions**: Matomo, Umami

### Implementation
1. Update `/assets/js/analytics.js`
2. Configure cookie consent integration
3. Test tracking with consent flow

## 🛠️ Maintenance

### Regular Tasks
- **Update dependencies** monthly
- **Check broken links** quarterly
- **Review analytics** monthly
- **Update content** as needed
- **Test accessibility** with each major update

### Content Updates
- **Members**: Update JSON file and regenerate if needed
- **Programmes**: Edit page content and search index
- **Blog posts**: Add new articles with proper metadata
- **Images**: Optimize new images before adding

### Performance Monitoring
- **Lighthouse CI** for continuous performance testing
- **Real User Monitoring** via analytics
- **Core Web Vitals** tracking

## 🤝 Contributing

### Code Style
- **Semantic HTML5** elements
- **BEM methodology** for CSS classes
- **ES2020+** JavaScript features
- **Accessible patterns** for all interactions

### Pull Request Process
1. **Fork** the repository
2. **Create feature branch** from `main`
3. **Test thoroughly** including accessibility
4. **Update documentation** if needed
5. **Submit pull request** with clear description

## 📞 Support

### Documentation
- **In-code comments** for complex functionality
- **README files** for each major component
- **JSDoc comments** for JavaScript functions

### Getting Help
- **Issues**: Use GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Email**: ScriptySphere@gmail.com for urgent matters

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Contributors**: All ScriptySphere team members and volunteers
- **Libraries**: AOS, Fuse.js, and other open-source tools
- **Community**: Bangladesh tech community for inspiration and support

---

**Built with ❤️ by ScriptySphere Team**  
*প্রযুক্তির আলোয় আগামীর বাংলাদেশ নির্মাণে অঙ্গীকারবদ্ধ।*
