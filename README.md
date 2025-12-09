# Verify
Chrome extension that checks news articles, highlights claims, and links to supporting sources.

## Overview
- Extracts claims from the active page and runs fact-check lookups using Gemini's Web Search Tool.
- Surfaces source links, timestamps, and summaries inside the popup UI.

## Features (current/target)
- Claim detection for news-style pages.
- Fact-check lookup with multiple sources when available.
- Inline summaries and dated sources.
- Optional auto-run when an article is detected.

## Development Setup
- Clone the repo: `git clone https://github.com/NamanLimani/Verify.git`
- Prereqs: Node.js 18+, npm.
- Install root deps: `npm install`.
- Backend: `cd verify-backend && node server.js`.
- Frontend: `cd verify-frontend && npm run build`.
- Load in Chrome: go to `chrome://extensions`, enable Developer Mode, and “Load unpacked” the `dist` (or build output) folder.

## Usage
- Click the Verify extension icon.
- Click the gear icon to open the settings tab.
- Paste your Gemini API key in the API key field (First time use only.)
- Return to the main menu and click "Run Analysis" to run the program on the website currently open.
- Hover over a highlighted claim to display a pop-up with details about the claim and search.
- Click on the claim to open the sidebar for additional information and features.

## License
Licensed under the GNU General Public License v3.0 (GPL-3.0). Personal and commercial use are permitted, but any modified or distributed versions must also be open source under GPL-3.0 terms.

## TODO:
Frontend:
- add overview section to popup
- add local history
- improve settings tab

Backend:
- for auto-run, make it determine if the page includes an article
- list multiple sources automatically for each claim
- make it run a deeper search in cases where first search doesn't yield results
- check that the sources are dated
- local api key storage and connect to frontend
- make it work with different LLMs
- improve local parsing (parse by sentence/period)