/**
 * CSS Selector Generation Utilities
 * 
 * These functions are meant to be serialized and injected into the prototype iframe
 * to generate CSS selectors when elements are clicked.
 */

/**
 * Tailwind utility class patterns to filter out
 */
const UTILITY_PATTERNS = [
  /^flex$/,
  /^grid$/,
  /^p-/,
  /^m-/,
  /^w-/,
  /^h-/,
  /^text-/,
  /^bg-/,
  /^border-/,
  /^rounded-/,
  /^shadow-/,
  /^font-/,
  /^opacity-/,
  /^transition-/,
  /^transform-/,
  /^hover:/,
  /^focus:/,
  /^active:/,
  /^sm:/,
  /^md:/,
  /^lg:/,
  /^xl:/,
  /^2xl:/,
  /^gap-/,
  /^space-/,
  /^items-/,
  /^justify-/,
  /^self-/,
  /^order-/,
  /^col-/,
  /^row-/,
  /^overflow-/,
  /^z-/,
  /^top-/,
  /^right-/,
  /^bottom-/,
  /^left-/,
  /^inset-/,
  /^absolute$/,
  /^relative$/,
  /^fixed$/,
  /^sticky$/,
  /^static$/,
  /^block$/,
  /^inline-/,
  /^hidden$/,
  /^visible$/,
  /^invisible$/,
];

/**
 * Check if a class is a utility class (should be filtered out)
 */
export function isUtilityClass(className: string): boolean {
  return UTILITY_PATTERNS.some(pattern => pattern.test(className));
}

/**
 * Get meaningful classes from an element (filtering out utilities)
 */
export function getMeaningfulClasses(element: Element): string[] {
  return Array.from(element.classList)
    .filter(c => !isUtilityClass(c))
    .slice(0, 2); // Take at most 2 meaningful classes
}

/**
 * Generate a CSS selector for an element
 * This function is designed to be serializable for injection into iframe
 */
export function generateSelector(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();
    
    // Prefer ID if available (terminates the path)
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    }
    
    // Add meaningful classes (not utility classes)
    const meaningfulClasses = getMeaningfulClasses(current);
    if (meaningfulClasses.length) {
      selector += `.${meaningfulClasses.join('.')}`;
    }
    
    // Add nth-child if needed for uniqueness
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Get the script to inject into the iframe for click handling
 * This script captures clicks and sends data back to the parent via postMessage
 * Comment mode can be toggled on/off via messages from the parent
 * Comment dots are rendered directly in the iframe for smooth scrolling
 */
export function getIframeScript(): string {
  return `
(function() {
  // Guard against double injection (the parent may inject on load and again
  // on mount if the load event fired before React attached its handler)
  if (window.__pinupInjected) {
    window.parent.postMessage({ type: 'PINUP_IFRAME_READY' }, '*');
    return;
  }
  window.__pinupInjected = true;

  // Comment mode state - when false, allow normal browsing
  let commentModeEnabled = false;
  // Store comment data and their dot elements
  let comments = [];
  let dotElements = new Map();
  let highlightedId = null;

  // Separator used to express a path through nested same-origin iframes:
  // "iframe#app >>> main > p:nth-of-type(2)"
  const FRAME_SEP = ' >>> ';

  // Utility class patterns to filter out
  const UTILITY_PATTERNS = [
    /^flex$/, /^grid$/, /^p-/, /^m-/, /^w-/, /^h-/, /^text-/, /^bg-/,
    /^border-/, /^rounded-/, /^shadow-/, /^font-/, /^opacity-/,
    /^transition-/, /^transform-/, /^hover:/, /^focus:/, /^active:/,
    /^sm:/, /^md:/, /^lg:/, /^xl:/, /^2xl:/, /^gap-/, /^space-/,
    /^items-/, /^justify-/, /^self-/, /^order-/, /^col-/, /^row-/,
    /^overflow-/, /^z-/, /^top-/, /^right-/, /^bottom-/, /^left-/,
    /^inset-/, /^absolute$/, /^relative$/, /^fixed$/, /^sticky$/,
    /^static$/, /^block$/, /^inline-/, /^hidden$/, /^visible$/, /^invisible$/
  ];

  function isUtilityClass(className) {
    return UTILITY_PATTERNS.some(pattern => pattern.test(className));
  }

  function getMeaningfulClasses(element) {
    return Array.from(element.classList)
      .filter(c => !isUtilityClass(c))
      .slice(0, 2);
  }

  // Selector for an element within its own document (no frame path)
  function generateLocalSelector(element) {
    const path = [];
    let current = element;
    const body = element.ownerDocument.body;
    
    while (current && current !== body && current.tagName !== 'HTML') {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = '#' + CSS.escape(current.id);
        path.unshift(selector);
        break;
      }
      
      const meaningfulClasses = getMeaningfulClasses(current);
      if (meaningfulClasses.length) {
        selector += '.' + meaningfulClasses.map(c => CSS.escape(c)).join('.');
      }
      
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          child => child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  // Full selector including the chain of nested iframes down from this document
  function generateSelector(element) {
    const parts = [generateLocalSelector(element)];
    let doc = element.ownerDocument;
    while (doc !== document) {
      const frameEl = doc.defaultView && doc.defaultView.frameElement;
      if (!frameEl) break;
      parts.unshift(generateLocalSelector(frameEl));
      doc = frameEl.ownerDocument;
    }
    return parts.join(FRAME_SEP);
  }

  // Resolve a (possibly frame-pathed) selector to an element, or null
  function resolveSelector(selector) {
    const parts = selector.split(FRAME_SEP);
    let doc = document;
    for (let i = 0; i < parts.length; i++) {
      const el = doc.querySelector(parts[i]);
      if (!el) return null;
      if (i === parts.length - 1) return el;
      const inner = getFrameDocument(el);
      if (!inner) return null;
      doc = inner;
    }
    return null;
  }

  function getElementText(element) {
    const text = element.textContent || '';
    return text.trim().slice(0, 100);
  }

  // Inject styles for comment dots into a given document
  function injectStyles(doc) {
    if (doc.getElementById('pinup-dot-styles')) return;
    const style = doc.createElement('style');
    style.id = 'pinup-dot-styles';
    style.textContent = \`
      .pinup-comment-dot {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #ec4899;
        border: 2px solid white;
        color: white;
        font-size: 11px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.15s, background 0.15s;
        z-index: 999999;
        pointer-events: auto;
      }
      .pinup-comment-dot:hover {
        transform: translate(-50%, -50%) scale(1.1);
      }
      .pinup-comment-dot.highlighted {
        background: #f472b6;
        transform: translate(-50%, -50%) scale(1.25);
      }
    \`;
    (doc.head || doc.documentElement).appendChild(style);
  }

  // Create a dot element for a comment in the given document
  function createDot(doc, comment, index) {
    const dot = doc.createElement('button');
    dot.className = 'pinup-comment-dot';
    dot.setAttribute('data-pinup-id', comment.id);
    dot.textContent = String(index + 1);
    dot.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({
        type: 'PINUP_DOT_CLICK',
        commentId: comment.id
      }, '*');
    });
    return dot;
  }

  // Position a dot relative to its target element
  function positionDot(dot, comment) {
    try {
      const element = resolveSelector(comment.selector);
      if (!element) {
        dot.style.display = 'none';
        return;
      }
      
      // Get element's position relative to its own document
      const win = element.ownerDocument.defaultView;
      const rect = element.getBoundingClientRect();
      const scrollX = win.scrollX || win.pageXOffset;
      const scrollY = win.scrollY || win.pageYOffset;
      
      // Calculate the absolute position in the document
      const absoluteLeft = rect.left + scrollX;
      const absoluteTop = rect.top + scrollY;
      
      // Position at the click point within the element
      const x = absoluteLeft + (rect.width * comment.clickX / 100);
      const y = absoluteTop + (rect.height * comment.clickY / 100);
      
      dot.style.display = commentModeEnabled ? 'flex' : 'none';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
    } catch (err) {
      dot.style.display = 'none';
    }
  }

  // Update all dot positions and visibility
  function updateDots() {
    // Remove old dots that are no longer in comments
    const currentIds = new Set(comments.map(c => c.id));
    dotElements.forEach((dot, id) => {
      if (!currentIds.has(id)) {
        dot.remove();
        dotElements.delete(id);
      }
    });

    // Create or update dots for each comment
    comments.forEach((comment, index) => {
      const element = resolveSelector(comment.selector);
      const targetDoc = element ? element.ownerDocument : document;
      let dot = dotElements.get(comment.id);
      // Recreate the dot if its document was torn down (nested frame reload)
      // or if the target element now lives in a different document
      if (dot && (!dot.isConnected || dot.ownerDocument !== targetDoc)) {
        dot.remove();
        dot = null;
      }
      if (!dot) {
        injectStyles(targetDoc);
        dot = createDot(targetDoc, comment, index);
        targetDoc.body.appendChild(dot);
        dotElements.set(comment.id, dot);
      }
      // Update number in case order changed
      dot.textContent = String(index + 1);
      // Update highlight state
      dot.classList.toggle('highlighted', comment.id === highlightedId);
      // Position the dot
      positionDot(dot, comment);
    });
  }

  // Show or hide all dots based on comment mode
  function setDotsVisible(visible) {
    dotElements.forEach(dot => {
      dot.style.display = visible ? 'flex' : 'none';
    });
  }

  // Listen for messages from parent
  window.addEventListener('message', function(e) {
    if (!e.data || typeof e.data !== 'object') return;
    
    if (e.data.type === 'PINUP_SET_COMMENT_MODE') {
      commentModeEnabled = e.data.enabled;
      setDotsVisible(commentModeEnabled);
      if (commentModeEnabled) {
        updateDots();
      }
    }
    
    // Update comments list
    if (e.data.type === 'PINUP_UPDATE_COMMENTS') {
      comments = e.data.comments || [];
      injectStyles(document);
      updateDots();
      setDotsVisible(commentModeEnabled);
    }
    
    // Update highlighted comment
    if (e.data.type === 'PINUP_SET_HIGHLIGHT') {
      highlightedId = e.data.commentId;
      dotElements.forEach((dot, id) => {
        dot.classList.toggle('highlighted', id === highlightedId);
      });
    }
  });

  // Reposition dots on resize (elements may have moved)
  window.addEventListener('resize', function() {
    if (commentModeEnabled) {
      updateDots();
    }
  });

  function handleClick(e) {
    // Ignore clicks on our dots
    if (e.target.classList && e.target.classList.contains('pinup-comment-dot')) {
      return;
    }
    
    // If comment mode is disabled, allow normal browsing
    if (!commentModeEnabled) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    const rect = element.getBoundingClientRect();
    
    // Calculate click position within element as percentage
    const clickX = rect.width ? Math.round(((e.clientX - rect.left) / rect.width) * 100) : 0;
    const clickY = rect.height ? Math.round(((e.clientY - rect.top) / rect.height) * 100) : 0;
    
    const data = {
      type: 'PINUP_ELEMENT_CLICK',
      selector: generateSelector(element),
      elementText: getElementText(element),
      clickX: clickX,
      clickY: clickY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
    
    window.parent.postMessage(data, '*');
  }

  // Get a same-origin iframe's document, or null if inaccessible / not ready
  function getFrameDocument(frameEl) {
    try {
      const doc = frameEl.contentDocument;
      if (!doc || !doc.body) return null;
      return doc;
    } catch (err) {
      return null;
    }
  }

  // Attach click capture to a document and to every same-origin iframe
  // inside it (recursively), now and as frames load or are added later.
  // Prototypes built as single-file bundles often render their pages inside
  // a nested <iframe srcdoc>, so clicks never reach the outer document.
  function attachToDocument(doc) {
    if (!doc || doc.__pinupAttached) return;
    doc.__pinupAttached = true;

    doc.addEventListener('click', handleClick, true);
    if (doc !== document && doc.defaultView) {
      doc.defaultView.addEventListener('resize', function() {
        if (commentModeEnabled) updateDots();
      });
    }

    Array.from(doc.querySelectorAll('iframe')).forEach(watchFrame);

    try {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
          Array.from(m.addedNodes).forEach(function(node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'IFRAME') watchFrame(node);
            else if (node.querySelectorAll) {
              Array.from(node.querySelectorAll('iframe')).forEach(watchFrame);
            }
          });
        });
      });
      observer.observe(doc.documentElement, { childList: true, subtree: true });
    } catch (err) {
      // MutationObserver unavailable - static frames still attached above
    }
  }

  function watchFrame(frameEl) {
    if (frameEl.__pinupWatched) return;
    frameEl.__pinupWatched = true;
    // Each (re)load of the frame produces a fresh document
    frameEl.addEventListener('load', function() {
      attachToDocument(getFrameDocument(frameEl));
      if (commentModeEnabled) updateDots();
    });
    const doc = getFrameDocument(frameEl);
    if (doc && doc.readyState !== 'loading') {
      attachToDocument(doc);
    }
  }

  attachToDocument(document);

  // Send ready message
  window.parent.postMessage({ type: 'PINUP_IFRAME_READY' }, '*');
})();
`;
}
