// This function will be injected onto the webpage
// It is complex because it safely finds text without breaking the page's HTML
export function highlightClaimsOnPage(claims) {
  // First, let's inject our CSS styles into the page
  const styleId = 'verify-highlight-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      .verify-highlight-verified {
        background-color: rgba(176, 220, 135, 0.5); /* trusted-leaf with 50% opacity */
        padding: 2px 0;
        border-radius: 3px;
      }
      .verify-highlight-disputed {
        background-color: rgba(223, 141, 141, 0.5); /* concerned-coral with 50% opacity */
        padding: 2px 0;
        border-radius: 3px;
      }
      .verify-highlight-questionable {
        background-color: rgba(243, 231, 136, 0.5); /* hello-yellow with 50% opacity */
        padding: 2px 0;
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }

  // A helper to get the right CSS class
  const getHighlightClass = (status) => {
    if (status === 'Verified') return 'verify-highlight-verified';
    if (status === 'Disputed') return 'verify-highlight-disputed';
    return 'verify-highlight-questionable';
  };

  // This is a list of HTML tags we should not search inside
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'HEADER', 'FOOTER', 'NAV'];

  // TreeWalker is the "correct" way to find all text nodes on a page
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    (node) => {
      // Reject text nodes that are inside our excluded tags
      if (excludedTags.includes(node.parentElement.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      // Reject empty/whitespace-only text nodes
      if (node.textContent.trim().length === 0) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  );

  // Helper function to find the best matching text segment
  function findBestMatch(textNodes, claimText) {
    // Strategy 1: Try exact match (case-insensitive)
    for (let i = 0; i < textNodes.length; i++) {
      const text = textNodes[i].textContent;
      const lowerText = text.toLowerCase();
      const lowerClaim = claimText.toLowerCase();
      const index = lowerText.indexOf(lowerClaim);
      
      if (index !== -1) {
        return { node: textNodes[i], index, length: claimText.length, method: 'exact' };
      }
    }
    
    // Strategy 2: Extract key phrases (4+ words) and try to match those
    const words = claimText.split(/\s+/);
    if (words.length >= 4) {
      // Try to find sequences of 4+ consecutive words
      for (let phraseLength = words.length; phraseLength >= 4; phraseLength--) {
        for (let start = 0; start <= words.length - phraseLength; start++) {
          const phrase = words.slice(start, start + phraseLength).join(' ');
          const lowerPhrase = phrase.toLowerCase();
          
          for (let i = 0; i < textNodes.length; i++) {
            const text = textNodes[i].textContent;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(lowerPhrase);
            
            if (index !== -1) {
              return { node: textNodes[i], index, length: phrase.length, method: 'phrase' };
            }
          }
        }
      }
    }
    
    return null; // No match found
  }

  // Loop over each claim from our analysis
  claims.forEach((claim, claimIndex) => {
    const claimText = claim.claim;
    const highlightClass = getHighlightClass(claim.status);
    
    console.log(`[Verify] Attempting to highlight claim ${claimIndex + 1}:`, claimText);

    // Rebuild the text nodes list for each claim since DOM changes after each highlight
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      (node) => {
        // Reject text nodes that are inside our excluded tags or highlight spans
        const parentTag = node.parentElement.tagName;
        const parentClass = node.parentElement.className;
        
        if (excludedTags.includes(parentTag)) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip already highlighted text
        if (parentClass && typeof parentClass === 'string' && parentClass.includes('verify-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        // Reject empty/whitespace-only text nodes
        if (node.textContent.trim().length === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    );

    const allTextNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      allTextNodes.push(node);
    }

    console.log(`[Verify] Found ${allTextNodes.length} text nodes to search`);

    // Try to find the best match
    const match = findBestMatch(allTextNodes, claimText);
    
    if (match) {
      console.log(`[Verify] Found ${match.method} match, highlighting...`);
      
      const { node, index, length } = match;
      const text = node.textContent;
      
      // 1. Create the highlight span with the ORIGINAL case from the page
      const span = document.createElement('span');
      span.className = highlightClass;
      span.textContent = text.substring(index, index + length);

      // 2. Get the text that comes *before* the match
      const beforeText = document.createTextNode(text.substring(0, index));
      
      // 3. Get the text that comes *after* the match
      const afterText = document.createTextNode(text.substring(index + length));

      // 4. Replace the original text node with: [before] + [highlight] + [after]
      const parent = node.parentNode;
      if (parent) {
        parent.insertBefore(beforeText, node);
        parent.insertBefore(span, node);
        parent.insertBefore(afterText, node);
        parent.removeChild(node);
      }
    } else {
      console.log(`[Verify] Could not find any match for claim ${claimIndex + 1}`);
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