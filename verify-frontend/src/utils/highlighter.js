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
    `;
    document.head.appendChild(style);
  }

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
}