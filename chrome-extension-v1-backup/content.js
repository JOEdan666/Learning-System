// Content script for Intelligent Partner
// Extracts page content and monitors text selection

(function() {
  'use strict';

  // Debounce helper
  function debounce(fn, delay) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Extract page snippet (first ~3000 chars of visible text)
  function extractPageSnippet() {
    // Try to get main content first
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content', '.post', '.article'];
    let content = '';

    for (const selector of mainSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim().length > 200) {
        content = el.innerText.trim();
        break;
      }
    }

    // Fallback to body
    if (!content) {
      content = document.body.innerText.trim();
    }

    // Clean up and limit
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .slice(0, 3000);

    return content;
  }

  // Send page info when content script loads
  function sendPageInfo() {
    const pageInfo = {
      type: 'PAGE_INFO',
      url: window.location.href,
      title: document.title,
      pageSnippet: extractPageSnippet()
    };

    chrome.runtime.sendMessage(pageInfo).catch(() => {
      // Extension context might not be ready
    });
  }

  // Send current selection
  function sendSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';

    chrome.runtime.sendMessage({
      type: 'SELECTION_CHANGED',
      selectionText: text,
      url: window.location.href,
      title: document.title
    }).catch(() => {
      // Extension context might not be ready
    });
  }

  // Debounced selection sender for smooth real-time updates
  const debouncedSendSelection = debounce(sendSelection, 50);

  // Monitor selection changes (real-time during drag)
  document.addEventListener('selectionchange', debouncedSendSelection);

  // Also send on mouseup for final selection
  document.addEventListener('mouseup', () => {
    setTimeout(sendSelection, 10);
  });

  // Send page info after DOM is ready
  if (document.readyState === 'complete') {
    sendPageInfo();
  } else {
    window.addEventListener('load', sendPageInfo);
  }

  // Re-send page info if side panel requests it
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REQUEST_PAGE_INFO') {
      sendPageInfo();
      sendResponse({ success: true });
    }
    if (message.type === 'REQUEST_SELECTION') {
      sendSelection();
      sendResponse({ success: true });
    }
    return true;
  });

})();
