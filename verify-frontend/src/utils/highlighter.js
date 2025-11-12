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

  const allTextNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    allTextNodes.push(node);
  }

  // Loop over each claim from our analysis
  claims.forEach((claim) => {
    const claimText = claim.claim;
    const highlightClass = getHighlightClass(claim.status);

    // Loop over all the text nodes we found
    allTextNodes.forEach((node) => {
      const text = node.textContent;
      const index = text.indexOf(claimText);

      if (index !== -1) {
        // We found the claim! Now we wrap it in a <span>
        
        // 1. Create the highlight span
        const span = document.createElement('span');
        span.className = highlightClass;
        span.textContent = claimText;

        // 2. Get the text that comes *before* the claim
        const beforeText = document.createTextNode(text.substring(0, index));
        
        // 3. Get the text that comes *after* the claim
        const afterText = document.createTextNode(text.substring(index + claimText.length));

        // 4. Replace the original text node with: [before] + [highlight] + [after]
        const parent = node.parentNode;
        parent.insertBefore(beforeText, node);
        parent.insertBefore(span, node);
        parent.insertBefore(afterText, node);
        parent.removeChild(node);
      }
    });
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