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
 */
export function getIframeScript(): string {
  return `
(function() {
  // Comment mode state - when false, allow normal browsing
  let commentModeEnabled = false;

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

  function generateSelector(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current.tagName !== 'HTML') {
      let selector = current.tagName.toLowerCase();
      
      if (current.id) {
        selector = '#' + current.id;
        path.unshift(selector);
        break;
      }
      
      const meaningfulClasses = getMeaningfulClasses(current);
      if (meaningfulClasses.length) {
        selector += '.' + meaningfulClasses.join('.');
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

  function getElementText(element) {
    const text = element.textContent || '';
    return text.trim().slice(0, 100);
  }

  // Listen for messages from parent to toggle comment mode
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'PINUP_SET_COMMENT_MODE') {
      commentModeEnabled = e.data.enabled;
    }
  });

  document.addEventListener('click', function(e) {
    // If comment mode is disabled, allow normal browsing
    if (!commentModeEnabled) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    const rect = element.getBoundingClientRect();
    
    // Calculate click position within element as percentage
    const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
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
  }, true);

  // Send ready message
  window.parent.postMessage({ type: 'PINUP_IFRAME_READY' }, '*');
})();
`;
}
