// Prevent auto-opening the side panel when the action icon is clicked.
// Only open it on explicit message.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});

// Toggle iframe overlay when action icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) return;

  const url = tab.url || '';
  const blockedSchemes = ['chrome://', 'chrome-extension://', 'edge://', 'about:'];
  if (blockedSchemes.some((p) => url.startsWith(p))) {
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