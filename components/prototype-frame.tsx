'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Comment, ElementClickData } from '@/types';
import { getIframeScript } from '@/lib/selectors';

interface PrototypeFrameProps {
  url: string;
  onElementClick: (data: ElementClickData) => void;
  commentModeEnabled: boolean;
  comments: Comment[];
  onDotClick?: (commentId: string) => void;
  highlightedCommentId?: string | null;
}

/**
 * Iframe wrapper for displaying prototypes with click capture
 * Comment dots are rendered inside the iframe for smooth scrolling
 */
export function PrototypeFrame({
  url,
  onElementClick,
  commentModeEnabled,
  comments,
  onDotClick,
  highlightedCommentId,
}: PrototypeFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Inject click handler script into iframe
  const injectScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      // Create and inject the script
      const script = doc.createElement('script');
      script.textContent = getIframeScript();
      doc.body.appendChild(script);
    } catch (err) {
      console.error('Failed to inject script (likely cross-origin):', err);
      // For cross-origin iframes, we'll use a different approach
      setError('Unable to capture clicks on this prototype (cross-origin restriction)');
    }
  }, []);

  // Handle iframe load
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
    injectScript();
  }, [injectScript]);

  // Handle iframe error
  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load prototype');
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'PINUP_ELEMENT_CLICK') {
        onElementClick({
          selector: event.data.selector,
          elementText: event.data.elementText,
          clickX: event.data.clickX,
          clickY: event.data.clickY,
          viewportWidth: event.data.viewportWidth,
          viewportHeight: event.data.viewportHeight,
        });
      } else if (event.data.type === 'PINUP_IFRAME_READY') {
        setIsLoading(false);
        setIframeReady(true);
      } else if (event.data.type === 'PINUP_DOT_CLICK') {
        // Handle dot click from inside iframe
        onDotClick?.(event.data.commentId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onElementClick, onDotClick]);

  // Send comment mode state to iframe when it changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage({
      type: 'PINUP_SET_COMMENT_MODE',
      enabled: commentModeEnabled,
    }, '*');
  }, [commentModeEnabled]);

  // Send comments to iframe for dot rendering
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !iframeReady) return;

    // Send comment data needed for dot positioning
    const commentData = comments.map((c) => ({
      id: c.id,
      selector: c.elementSelector,
      clickX: c.clickX,
      clickY: c.clickY,
    }));

    iframe.contentWindow.postMessage({
      type: 'PINUP_UPDATE_COMMENTS',
      comments: commentData,
    }, '*');
  }, [comments, iframeReady]);

  // Send highlight state to iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !iframeReady) return;

    iframe.contentWindow.postMessage({
      type: 'PINUP_SET_HIGHLIGHT',
      commentId: highlightedCommentId,
    }, '*');
  }, [highlightedCommentId, iframeReady]);

  return (
    <div className="relative flex-1 bg-[#1a1a1a]">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading prototype...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <div className="text-center max-w-md px-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-200 mb-2">
              Unable to load prototype
            </h3>
            <p className="text-gray-500 text-xs mb-4">{error}</p>
            <button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                if (iframeRef.current) {
                  iframeRef.current.src = url;
                }
              }}
              className="px-4 py-2 bg-[#3d3d3d] hover:bg-[#454545] text-gray-300 rounded-md text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={url}
        onLoad={handleLoad}
        onError={handleError}
        className="w-full h-full border-0"
        title="Prototype preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />

      {/* Click Hint - only shown in comment mode */}
      {commentModeEnabled && !isLoading && !error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#2d2d2d] text-gray-400 px-4 py-2 rounded-full text-xs border border-gray-700">
          Click anywhere to add a comment
        </div>
      )}
    </div>
  );
}
