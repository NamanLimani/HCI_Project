# Verify - Claim Verification Chrome Extension

## Project Overview

A Chrome extension that automatically analyzes articles to identify factual claims and verifies them against reliable sources using AI and fact-checking APIs. Helps users critically evaluate content by showing which claims are verified, questionable, or disputed.

MVP core features: 
-> extracts claims made by the article 
-> checks included sources and searches for other sources that back or dispute
-> returns results: verified/questionable/disputed

V2+ features:
- Languge sentiment analysis
- Overall site analysis (credibility, political bias, etc.)
- AI Authorship analysis
---

## Tech Stack

### Backend (Local API Server)
```
Node.js + Express
├── Perplexity API (Sonar Online model)
│   └── Claim verification + web search
│   └── Returns sources automatically
├── Google Fact Check API
│   └── Additional fact-check verification
└── Port: localhost:3000
```

**API Costs (per 1000 articles):**
- Perplexity: ~$10-30
- Google Fact Check: Free

### Frontend (Chrome Extension)
```
React 18 + Vite + Tailwind CSS
├── Chrome Extension Manifest V3
├── @crxjs/vite-plugin (build tool)
├── Side Panel API (main UI)
├── Popup (quick summary)
└── Content Script (page interaction)
```

**Why this stack:**
- **Perplexity**: Gets verification + sources in one API call
- **React + Vite**: Fast dev experience, modern
- **Side Panel**: Chrome's native side UI, professional
- **Tailwind**: Quick styling, small bundle size

---

## Architecture

```
┌─────────────────┐
│   Web Article   │
└────────┬────────┘
         │ User clicks extension
         ↓
┌─────────────────────────────────────┐
│     Chrome Extension (Frontend)     │
│  ┌─────────────────────────────┐   │
│  │  Content Script             │   │
│  │  • Extract article text     │   │
│  │  • Highlight claims (v2)    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Popup                      │   │
│  │  • Quick summary            │   │
│  │  • "Analyze" button         │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Side Panel                 │   │
│  │  • Detailed results         │   │
│  │  • Claim-by-claim breakdown │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │ HTTP Request
               ↓
┌─────────────────────────────────────┐
│    Backend API (Node.js/Express)    │
│  ┌─────────────────────────────┐   │
│  │  POST /api/analyze          │   │
│  │  • Receives article text    │   │
│  │  • Calls Perplexity API     │   │
│  │  • Calls Fact Check API     │   │
│  │  • Returns verification     │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│          External APIs              │
│  • Perplexity (Sonar Online)        │
│  • Google Fact Check API            │
└─────────────────────────────────────┘
```

---

## User Flow

### 1. User Interaction
```
User reading article
    ↓
Click extension icon
    ↓
Popup appears: "Analyze this article?"
    ↓
Click "Analyze" button
    ↓
Loading state: "Analyzing claims..."
    ↓
Results appear in Side Panel
```

### 2. Results Display

**Side Panel Layout:**
```
┌───────────────────────────────────┐
│  🔍 Article Verification          │
│                                   │
│  📊 Summary                       │
│  • 7 claims analyzed              │
│  • 4 verified ✅                  │
│  • 2 questionable ⚠️              │
│  • 1 disputed ❌                  │
│                                   │
│  ─────────────────────────────    │
│                                   │
│  📝 Claims                        │
│                                   │
│  ✅ Claim 1:                      │
│  "COVID vaccines reduced          │
│   hospitalizations by 90%"        │
│                                   │
│  Verification:                    │
│  • Found in: CDC.gov, Nature      │
│  • Fact-checked: TRUE             │
│  • Source: CDC Study 2023         │
│  • Confidence: High               │
│  [View Sources →]                 │
│                                   │
│  ⚠️ Claim 2:                      │
│  "Study shows X causes Y"         │
│                                   │
│  Verification:                    │
│  • Conflicting information        │
│  • Source cited not found         │
│  • Needs manual review            │
│  [View Sources →]                 │
│                                   │
│  ❌ Claim 3:                      │
│  "5G causes cancer"               │
│                                   │
│  Verification:                    │
│  • Fact-checked: FALSE            │
│  • Disputed by: Snopes, Reuters   │
│  • Scientific consensus: No       │
│  [View Sources →]                 │
└───────────────────────────────────┘
```

---

## Data Flow

### Request Flow
```javascript
// 1. Content script extracts text
const articleText = document.body.innerText;

// 2. Send to backend
const response = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ text: articleText })
});

// 3. Backend processes
// Step 1: Extract claims with Perplexity
const claimsPrompt = `Extract 5-10 main factual claims from this article: ${text}`;
const claims = await perplexityAPI.query(claimsPrompt);

// Step 2: Verify each claim
for (const claim of claims) {
  // Check Perplexity for verification
  const verification = await perplexityAPI.search(claim.text);
  
  // Check Google Fact Check
  const factCheck = await googleFactCheckAPI.search(claim.text);
  
  // Combine results
  claim.verification = combineResults(verification, factCheck);
}

// 4. Return to extension
return { claims, summary };
```

### Response Schema
```typescript
interface AnalysisResponse {
  summary: {
    total_claims: number;
    verified: number;
    questionable: number;
    disputed: number;
  };
  claims: Array<{
    id: string;
    text: string;
    status: 'verified' | 'questionable' | 'disputed' | 'unverified';
    confidence: 'high' | 'medium' | 'low';
    source_cited: string | null;
    verification: {
      fact_checks: Array<{
        source: string; // "Snopes", "FactCheck.org"
        rating: string;
        url: string;
      }>;
      supporting_sources: Array<{
        title: string;
        url: string;
        snippet: string;
      }>;
      reasoning: string;
    };
  }>;
  article_metadata: {
    url: string;
    title: string;
    analyzed_at: string;
  };
}
```

---

## Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Chrome browser
- API keys:
  - Perplexity API key
  - Google Fact Check API key (optional for MVP)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add API keys to .env
PERPLEXITY_API_KEY=your_key_here
GOOGLE_FACT_CHECK_API_KEY=your_key_here
PORT=3000

# Start server
npm run dev
```

### Frontend Setup
```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Start development build
npm run dev

# Build for production
npm run build
```

### Load Extension in Chrome
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `extension/dist` folder
6. Extension icon appears in toolbar

---

## API Integration

### Perplexity API

**Endpoint:** `https://api.perplexity.ai/chat/completions`

**Model:** `sonar` or `sonar-online` (recommended for real-time search)

**Example Request:**
```javascript
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sonar-online',
    messages: [
      {
        role: 'system',
        content: 'You are a fact-checking assistant. Verify claims and cite sources.'
      },
      {
        role: 'user',
        content: `Verify this claim and provide sources: "${claim}"`
      }
    ],
    temperature: 0.2,
    return_citations: true
  })
});
```

**Response includes:**
- Answer/verification
- Citations with URLs
- Confidence indicators

### Google Fact Check API

**Endpoint:** `https://factchecktools.googleapis.com/v1alpha1/claims:search`

**Example Request:**
```javascript
const url = new URL('https://factchecktools.googleapis.com/v1alpha1/claims:search');
url.searchParams.append('query', claim);
url.searchParams.append('key', GOOGLE_API_KEY);

const response = await fetch(url);
const data = await response.json();

// Response contains fact-checks from various organizations
data.claims.forEach(claim => {
  claim.claimReview.forEach(review => {
    console.log(review.publisher.name); // "Snopes", etc.
    console.log(review.textualRating);   // "True", "False", etc.
    console.log(review.url);             // Link to fact-check
  });
});
```

---

## File Structure

```
verify/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server
│   │   ├── routes/
│   │   │   └── analyze.js        # Analysis endpoint
│   │   ├── services/
│   │   │   ├── perplexity.js     # Perplexity API wrapper
│   │   │   ├── factcheck.js      # Google Fact Check wrapper
│   │   │   └── analyzer.js       # Main analysis logic
│   │   └── utils/
│   │       └── helpers.js        # Utility functions
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
│
├── extension/
│   ├── public/
│   │   ├── icons/                # Extension icons
│   │   └── manifest.json         # Chrome extension manifest
│   ├── src/
│   │   ├── background/
│   │   │   └── index.js          # Service worker
│   │   ├── content/
│   │   │   ├── ContentScript.jsx # Injected into pages
│   │   │   └── index.css
│   │   ├── popup/
│   │   │   ├── Popup.jsx         # Extension popup
│   │   │   └── index.css
│   │   ├── sidepanel/
│   │   │   ├── SidePanel.jsx     # Main results UI
│   │   │   ├── components/
│   │   │   │   ├── ClaimCard.jsx
│   │   │   │   ├── Summary.jsx
│   │   │   │   └── SourceList.jsx
│   │   │   └── index.css
│   │   ├── shared/
│   │   │   ├── api.js            # API client
│   │   │   ├── storage.js        # Chrome storage wrapper
│   │   │   └── constants.js
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
│
├── OVERVIEW.md                    # This file
├── README.md                      # User-facing documentation
└── Benchmarking.pdf              # Research reference
```
---

## Development Workflow

### Sprint Structure (3 weeks)

**Week 1: Backend + Core Logic**
- [ ] Set up Node.js/Express server
- [ ] Implement Perplexity API wrapper
- [ ] Implement Google Fact Check API wrapper
- [ ] Create claim extraction logic
- [ ] Create verification logic
- [ ] Test API endpoints with Postman
- [ ] Write basic error handling

**Week 2: Extension Structure + Basic UI**
- [ ] Set up Vite + React + @crxjs
- [ ] Create manifest.json
- [ ] Build content script (text extraction)
- [ ] Build popup component
- [ ] Build side panel component
- [ ] Connect to backend API
- [ ] Test in Chrome

**Week 3: Polish + Demo Prep**
- [ ] Improve UI/UX
- [ ] Add loading states
- [ ] Add error states
- [ ] Implement caching
- [ ] Add rate limiting
- [ ] Write documentation
- [ ] Create demo video/presentation
- [ ] Test on various websites

### Git Workflow
```bash
main          # Production-ready code
└── develop   # Development branch
    ├── feature/backend-api
    ├── feature/claim-extraction
    ├── feature/extension-popup
    └── feature/side-panel
```

### Daily Workflow
1. Pull latest from `develop`
2. Create feature branch
3. Develop feature
4. Test locally
5. Create PR to `develop`
6. Review + merge
7. Test integration

---

## Testing Strategy

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Can analyze BBC article
- [ ] Can analyze CNN article
- [ ] Can analyze blog post
- [ ] Handles articles with no claims gracefully
- [ ] Handles very long articles
- [ ] Handles articles with paywalls
- [ ] Side panel opens correctly
- [ ] Results display correctly
- [ ] Sources are clickable
- [ ] Works on different websites
- [ ] Caching prevents duplicate analyses

### Test Articles (Various Types)
1. **News**: BBC, CNN, Reuters article
2. **Opinion**: Medium blog post
3. **Scientific**: Scientific American article
4. **Political**: Fact-checkable political claim
5. **Misinformation**: Known false claim article

### API Testing
```bash
# Test backend endpoint
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "The COVID-19 vaccine is 95% effective."}'
```

---

## Configuration

### Backend Environment Variables
```env
# .env
PORT=3000
NODE_ENV=development

# API Keys
PERPLEXITY_API_KEY=pplx-xxxxx
GOOGLE_FACT_CHECK_API_KEY=AIza-xxxxx

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=10
MAX_ARTICLE_LENGTH=50000

# Cache
CACHE_DURATION_HOURS=24
```

### Extension Manifest Configuration
```json
{
  "manifest_version": 3,
  "name": "Verify - Claim Checker",
  "version": "0.1.0",
  "description": "Automatically verify claims in articles",
  "permissions": [
    "activeTab",
    "storage",
    "sidePanel"
  ],
  "host_permissions": [
    "http://localhost:3000/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icons/icon-48.png"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

---

## Performance Considerations

### Optimization Strategies
1. **Caching**: Store results in Chrome storage (24h TTL)
2. **Rate Limiting**: Max 10 requests/minute
3. **Article Length**: Limit to 50,000 chars
4. **Claim Limit**: Extract max 10 claims per article
5. **Lazy Loading**: Only load side panel when needed
6. **Debouncing**: Prevent duplicate rapid requests

### Expected Performance
- Analysis time: 5-15 seconds
- Backend processing: 3-10 seconds
- UI rendering: < 1 second
- Memory usage: < 50MB
- Storage per article: ~50KB

---

## Security & Privacy

### Data Handling
- **No user data stored** on external servers
- **Article text** sent to backend (local)
- **API calls** to Perplexity/Google (required for verification)
- **Cache stored locally** in browser
- **No tracking** or analytics

### API Key Security
- Store in .secrets folder (backend)
- Never commit to git
- Use `.gitignore`

---

## Resources

### Documentation
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [Perplexity API Docs](https://docs.perplexity.ai/)
- [Google Fact Check API](https://developers.google.com/fact-check/tools/api)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Debugging
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging

---
## Next Steps

### Immediate Actions
1. Set up repository structure
2. Get API keys (Perplexity, Google)
3. Set up backend server
4. Set up extension scaffold
5. Create initial commit

### First Milestone (Week 1)
- Backend API working
- Can extract claims from text
- Can verify one claim with Perplexity
- Returns JSON response

### Second Milestone (Week 2)
- Extension loads in Chrome
- Can extract text from webpage
- Can call backend API
- Shows results in popup

### Final Milestone (Week 3)
- Full side panel UI
- All features working
- Tested on multiple sites
- Demo-ready
