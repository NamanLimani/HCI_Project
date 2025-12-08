// This function will be injected onto the webpage
// It finds the exact sentence from each claim and highlights it
export function highlightClaimsOnPage(claims) {
  // 1. Inject CSS styles if they don't exist
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

    // Position to the right of the highlight
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

  // 2. Process each claim
  claims.forEach((claim, claimIndex) => {
    const sentence = claim.originalSentence || claim.claim;
    const highlightClass = getHighlightClass(claim.status);
    
    console.log(`[Verify] Highlighting claim ${claimIndex + 1}:`, sentence);

    // 3. Use window.find() - This is the robust "Search in Page" method
    // It works even if the text crosses HTML tags (like <b> or <i>)
    try {
      // Clear any existing selection to start clean
      const selection = window.getSelection();
      selection.removeAllRanges();

      // window.find(string, caseSensitive, backward, wrapAround, wholeWord, searchInFrames, showDialog)
      const found = window.find(sentence, false, false, true, false, true, false);

      if (found) {
        // If found, the text is now "selected". We grab that range.
        const range = selection.getRangeAt(0);
        
        // Create our highlight span
        const span = document.createElement('span');
        span.className = highlightClass;
        span.title = `Status: ${claim.status}`;
        
        // Wrap the found text in our span
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
          console.log(`[Verify] ✓ Highlighted successfully`);
        } catch (e) {
          // surroundContents fails if the range splits a non-text node partially. 
          // This is a rare edge case with window.find, but usually acceptable to skip.
          console.warn(`[Verify] Could not wrap simplified range:`, e);
        }

        // Collapse selection so the user doesn't see blue text selection
        selection.collapseToEnd();
      } else {
        console.log(`[Verify] ✗ Could not find sentence in page via window.find()`);
      }
    } catch (e) {
      console.error(`[Verify] Error during highlighting:`, e);
    }
  });
  
  // Clear selection one last time to be clean
  window.getSelection().removeAllRanges();
}

// This function will be injected to remove all highlights
export function clearHighlightsOnPage() {
  const classes = [
    '.verify-highlight-verified',
    '.verify-highlight-disputed',
    '.verify-highlight-questionable'
  ];
  
  classes.forEach(cls => {
    const highlights = document.querySelectorAll(cls);
    highlights.forEach(span => {
      // Replace the <span> with its own text content (unwrap it)
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
  });
  
  document.body.normalize(); 
  
  const tooltip = document.getElementById('verify-hover-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}