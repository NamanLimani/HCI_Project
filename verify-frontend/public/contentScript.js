(() => {
  const IFRAME_ID = 'verify-iframe-overlay';
  const CONTAINER_ID = 'verify-iframe-container';

  const measureAndSetHeight = (heightPx) => {
    const container = document.getElementById(CONTAINER_ID);
    const iframe = document.getElementById(IFRAME_ID);
    if (!container || !iframe || !heightPx) return;
    // Use reported height directly - component already has its own padding
    const maxViewport = window.innerHeight - 24;
    const height = Math.min(heightPx, maxViewport);
    container.style.height = `${height}px`;
    iframe.style.height = `${height}px`;
  };

  const removeOverlay = () => {
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) existing.remove();
  };

  const createOverlay = () => {
    removeOverlay();
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.top = '12px';
    container.style.right = '12px';
    container.style.width = '360px';
    container.style.minHeight = '0';
    container.style.maxHeight = 'none';
    container.style.zIndex = '2147483646';
    container.style.display = 'inline-block';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'stretch';
    container.style.pointerEvents = 'none'; // only iframe/btn receive
    container.style.overflow = 'visible';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close Verify');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '-8px';
    closeBtn.style.right = '-8px';
    closeBtn.style.width = '28px';
    closeBtn.style.height = '28px';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.border = 'none';
    closeBtn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.18)';
    closeBtn.style.background = '#fff';
    closeBtn.style.color = '#111';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.fontWeight = '700';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.pointerEvents = 'auto';
    closeBtn.onclick = () => removeOverlay();

    const iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = chrome.runtime.getURL('iframe.html');
    iframe.style.width = '100%';
    iframe.style.height = 'auto';
    iframe.style.minHeight = '0';
    iframe.style.maxHeight = 'none';
    iframe.style.display = 'block';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '14px';
    iframe.style.boxShadow = '0 18px 40px rgba(0,0,0,0.16)';
    iframe.style.overflow = 'hidden';
    iframe.style.pointerEvents = 'auto';
    iframe.style.background = '#ffffff';
    iframe.setAttribute('scrolling', 'no');

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    document.body.appendChild(container);
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'TOGGLE_IFRAME') {
      const existing = document.getElementById(CONTAINER_ID);
      if (existing) {
        removeOverlay();
        sendResponse?.({ open: false });
      } else {
        createOverlay();
        sendResponse?.({ open: true });
      }
    }
  });

  window.addEventListener('message', (event) => {
    if (!event?.data || event.data.type !== 'VERIFY_IFRAME_HEIGHT') return;
    measureAndSetHeight(event.data.height);
  });
})();

