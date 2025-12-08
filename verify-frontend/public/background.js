const blockedSchemes = ['chrome://', 'chrome-extension://', 'edge://', 'about:'];
const AUTO_RUN_KEY = 'autoRunEnabled';
const LAST_ANALYZED_KEY = 'lastAnalyzedUrl';
const inProgressTabs = new Set();
const analyzedByTab = new Map();
let autoRunEnabled = false;

const shouldSkipUrl = (url) => !url || blockedSchemes.some((p) => url.startsWith(p));

// Prevent auto-opening the side panel when the action icon is clicked.
// Only open it on explicit message.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// Toggle iframe overlay when action icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;

  const url = tab.url || '';
  if (shouldSkipUrl(url)) {
    console.warn('Cannot inject Verify iframe on restricted page:', url);
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_IFRAME' }, () => {
    if (chrome.runtime.lastError) {
      // Ignore missing receiver (e.g., restricted pages)
      console.debug('SendMessage failed:', chrome.runtime.lastError.message);
    }
  });
});

// Open the side panel only when requested (not on every action click)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'OPEN_SIDEPANEL' && sender?.tab?.id) {
    chrome.sidePanel
      .open({ tabId: sender.tab.id })
      .catch((err) => console.error('Failed to open side panel', err));
    sendResponse({ opened: true });
  }
});

const loadAutoRunSetting = () => {
  chrome.storage?.local?.get?.([AUTO_RUN_KEY], (res) => {
    autoRunEnabled = Boolean(res?.[AUTO_RUN_KEY]);
  });
};

loadAutoRunSetting();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[AUTO_RUN_KEY]) return;
  autoRunEnabled = Boolean(changes[AUTO_RUN_KEY].newValue);

  if (autoRunEnabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (tab?.id) {
        triggerAutoRun(tab.id, tab.url || '');
      }
    });
  }
});

const markAnalyzed = (tabId, url) => {
  if (!url) return;
  analyzedByTab.set(tabId, url);
  try {
    chrome.storage?.local?.set?.({ [LAST_ANALYZED_KEY]: url });
  } catch (err) {
    console.warn('Auto-run: failed to persist analyzed url', err);
  }
};

// Copied from src/utils/highlighter.js for injection
const highlightClaimsOnPage = (claims) => {
  const styleId = 'verify-highlight-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .verify-highlight-verified {
        background-color: rgba(176, 220, 135, 0.5);
        cursor: pointer;
      }
      .verify-highlight-disputed {
        background-color: rgba(223, 141, 141, 0.5);
        cursor: pointer;
      }
      .verify-highlight-questionable {
        background-color: rgba(243, 231, 136, 0.5);
        cursor: pointer;
      }
      .verify-tooltip {
        position: absolute;
        z-index: 2147483647;
        max-width: 320px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        border-radius: 10px;
        padding: 12px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #111827;
      }
      .verify-tooltip h4 {
        margin: 0 0 6px 0;
        font-size: 13px;
        font-weight: 700;
      }
      .verify-tooltip p {
        margin: 0 0 8px 0;
        font-size: 12px;
        line-height: 1.4;
      }
      .verify-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 999px;
      }
      .verify-pill-verified { background: #ecf8e6; color: #3f6212; }
      .verify-pill-questionable { background: #fef3c7; color: #92400e; }
      .verify-pill-disputed { background: #fee2e2; color: #991b1b; }
      .verify-tooltip .verify-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
      }
      .verify-tooltip button {
        border: none;
        cursor: pointer;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        padding: 7px 10px;
      }
      .verify-tooltip .verify-view-btn {
        background: #0f58d6;
        color: #fff;
      }
      .verify-tooltip .verify-view-btn:hover {
        background: #0c48b1;
      }
    `;
    document.head.appendChild(style);
  }

  const getTooltipContainer = () => {
    let container = document.getElementById('verify-hover-tooltip');
    if (!container) {
      container = document.createElement('div');
      container.id = 'verify-hover-tooltip';
      container.className = 'verify-tooltip';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    return container;
  };

  const showTooltip = (claim, targetEl) => {
    const container = getTooltipContainer();
    const rect = targetEl.getBoundingClientRect();

    const pillClass =
      claim.status === 'Verified'
        ? 'verify-pill-verified'
        : claim.status === 'Disputed'
        ? 'verify-pill-disputed'
        : 'verify-pill-questionable';

    container.innerHTML = `
      <div class="verify-pill ${pillClass}" style="margin-bottom:8px;">
        <span>${claim.status || 'Claim'}</span>
      </div>
      <h4>Claim</h4>
      <p>${claim.claim || 'No claim text'}</p>
      ${
        claim.source
          ? `<p style="font-size:11px;color:#6b7280;">Source: ${claim.source}</p>`
          : ''
      }
      ${
        claim.explanation
          ? `<p style="font-size:11px;color:#374151;">${claim.explanation}</p>`
          : ''
      }
    `;

    const top = rect.top + window.scrollY + rect.height + 6;
    const left = Math.min(
      rect.left + window.scrollX + 10,
      window.scrollX + window.innerWidth - container.offsetWidth - 16
    );
    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
    container.style.display = 'block';
  };

  const hideTooltip = () => {
    const container = document.getElementById('verify-hover-tooltip');
    if (container) container.style.display = 'none';
  };

  const getHighlightClass = (status) => {
    if (status === 'Verified') return 'verify-highlight-verified';
    if (status === 'Disputed') return 'verify-highlight-disputed';
    return 'verify-highlight-questionable';
  };

  claims.forEach((claim, claimIndex) => {
    const sentence = claim.originalSentence || claim.claim;
    const highlightClass = getHighlightClass(claim.status);

    try {
      const selection = window.getSelection();
      selection.removeAllRanges();

      const found = window.find(sentence, false, false, true, false, true, false);

      if (found) {
        const range = selection.getRangeAt(0);

        const span = document.createElement('span');
        span.className = highlightClass;
        span.title = `Status: ${claim.status}`;

        try {
          range.surroundContents(span);
          span.addEventListener('mouseenter', () => showTooltip(claim, span));
          span.addEventListener('mouseleave', hideTooltip);
          span.addEventListener('click', () => {
            try {
              if (chrome?.storage?.local) {
                chrome.storage.local.set({ selectedClaim: claim }, () => {
                  chrome.runtime?.sendMessage({ type: 'OPEN_SIDEPANEL' });
                });
              }
            } catch (err) {
              console.warn('Could not open side panel from click', err);
            }
          });
        } catch (e) {
          console.warn(`[Verify] Could not wrap simplified range:`, e);
        }

        selection.collapseToEnd();
      }
    } catch (e) {
      console.error(`[Verify] Error during highlighting:`, e);
    }
  });

  window.getSelection().removeAllRanges();
};

const runHighlight = async (tabId, claims) => {
  if (!claims?.length) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: highlightClaimsOnPage,
      args: [claims],
    });
  } catch (err) {
    console.warn('Auto-run: failed to inject highlights', err);
  }
};

const fetchArticleText = async (tabId) => {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.body.innerText,
    });
    return result?.result || '';
  } catch (err) {
    console.warn('Auto-run: could not read page content', err);
    return '';
  }
};

const streamAndHighlight = async (body, tabId) => {
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEventType = '';
  let currentData = '';
  const allClaims = [];

  const processEvent = async () => {
    if (!currentData || !currentEventType) return;
    try {
      const parsed = JSON.parse(currentData);
      if (currentEventType === 'claim') {
        allClaims.push(parsed);
        await runHighlight(tabId, [...allClaims]);
      }
    } catch (err) {
      console.warn('Auto-run: SSE parse error', err);
    } finally {
      currentEventType = '';
      currentData = '';
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      await processEvent();
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        await processEvent();
        currentEventType = line.substring(7).trim();
      } else if (line.startsWith('data: ')) {
        currentData = line.substring(6).trim();
      } else if (line === '') {
        await processEvent();
      }
    }
  }
};

const runAnalysisForTab = async (tabId, url) => {
  if (shouldSkipUrl(url)) return;

  const articleText = await fetchArticleText(tabId);
  if (!articleText || articleText.length < 100) return;

  let response;
  try {
    response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleText, articleUrl: url }),
    });
  } catch (err) {
    console.warn('Auto-run: request failed', err);
    return;
  }

  if (!response.ok) {
    console.warn('Auto-run: backend returned error', response.status);
    return;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    try {
      const data = await response.json();
      await runHighlight(tabId, data.results || []);
      markAnalyzed(tabId, url);
    } catch (err) {
      console.warn('Auto-run: parse failed', err);
    }
    return;
  }

  try {
    await streamAndHighlight(response.body, tabId);
    markAnalyzed(tabId, url);
  } catch (err) {
    console.warn('Auto-run: streaming failed', err);
  }
};

const triggerAutoRun = (tabId, url) => {
  if (!autoRunEnabled || shouldSkipUrl(url)) return;
  if (inProgressTabs.has(tabId)) return;

  const lastForTab = analyzedByTab.get(tabId);
  if (lastForTab && lastForTab === url) return;

  inProgressTabs.add(tabId);
  runAnalysisForTab(tabId, url)
    .catch((err) => console.warn('Auto-run: analyze error', err))
    .finally(() => inProgressTabs.delete(tabId));
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    analyzedByTab.delete(tabId);
    inProgressTabs.delete(tabId);
    return;
  }

  if (changeInfo.status === 'complete' && tab?.active) {
    triggerAutoRun(tabId, tab.url || '');
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === 'complete') {
      triggerAutoRun(tabId, tab.url || '');
    }
  } catch (err) {
    console.warn('Auto-run: failed to load tab info', err);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  analyzedByTab.delete(tabId);
  inProgressTabs.delete(tabId);
});