// This function will be injected onto the webpage
// It finds the exact sentence from each claim and highlights it
export function highlightClaimsOnPage(claims) {
  // Inject CSS styles
  const styleId = 'verify-highlight-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .verify-highlight-verified {
        background-color: rgba(176, 220, 135, 0.5);
        padding: 2px 0;
        border-radius: 3px;
      }
      .verify-highlight-disputed {
        background-color: rgba(223, 141, 141, 0.5);
        padding: 2px 0;
        border-radius: 3px;
      }
      .verify-highlight-questionable {
        background-color: rgba(243, 231, 136, 0.5);
        padding: 2px 0;
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  // Get the right CSS class for each status
  const getHighlightClass = (status) => {
    if (status === 'Verified') return 'verify-highlight-verified';
    if (status === 'Disputed') return 'verify-highlight-disputed';
    return 'verify-highlight-questionable';
  };

  // Tags we should not search inside
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'];

  // Process each claim
  claims.forEach((claim, claimIndex) => {
    const sentence = claim.originalSentence || claim.claim;
    const highlightClass = getHighlightClass(claim.status);
    
    console.log(`[Verify] Highlighting claim ${claimIndex + 1}:`, sentence);

    // Get all text nodes that haven't been highlighted yet
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      (node) => {
        const parentTag = node.parentElement.tagName;
        const parentClass = node.parentElement.className;
        
        // Skip excluded tags and already highlighted text
        if (excludedTags.includes(parentTag)) return NodeFilter.FILTER_REJECT;
        if (parentClass && typeof parentClass === 'string' && parentClass.includes('verify-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
        
        return NodeFilter.FILTER_ACCEPT;
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    // Try to find the sentence in the text nodes
    const searchText = sentence.toLowerCase().trim();
    let found = false;

    for (let i = 0; i < textNodes.length; i++) {
      const nodeText = textNodes[i].textContent;
      const lowerText = nodeText.toLowerCase();
      const index = lowerText.indexOf(searchText);
      
      if (index !== -1) {
        // Highlight the exact sentence
        const beforeText = nodeText.substring(0, index);
        const matchText = nodeText.substring(index, index + searchText.length);
        const afterText = nodeText.substring(index + searchText.length);
        
        const span = document.createElement('span');
        span.className = highlightClass;
        span.textContent = matchText;

        const parent = textNodes[i].parentNode;
        if (parent) {
          if (beforeText) parent.insertBefore(document.createTextNode(beforeText), textNodes[i]);
          parent.insertBefore(span, textNodes[i]);
          if (afterText) parent.insertBefore(document.createTextNode(afterText), textNodes[i]);
          parent.removeChild(textNodes[i]);
        }
        
        found = true;
        console.log(`[Verify] ✓ Highlighted successfully`);
        break;
      }
    }

    if (!found) {
      console.log(`[Verify] ✗ Could not find sentence in page`);
    }
  });
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
      // Replace the <span> with its own text content
      const parent = span.parentNode;
      parent.replaceChild(document.createTextNode(span.textContent), span);
      // This is a simple version. A more robust version would merge adjacent text nodes.
    });
  });
  
  // Optional: Clean up merged text nodes
  document.body.normalize(); 
}