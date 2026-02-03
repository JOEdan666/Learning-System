// Content script for Intelligent Partner v2
// Extracts visible page context and tracks recent signals

(function() {
  'use strict';

  const SIGNALS_KEY = 'ip_recent_signals_v2';
  const STATE_KEY = 'ip_world_state_v2';
  const MAX_SIGNALS = 5;

  function cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  function isElementVisible(rect) {
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
  }

  function extractVisibleSnippet(maxChars = 2000) {
    const rootSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
    let root = document.body;

    for (const selector of rootSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 200) {
        root = el;
        break;
      }
    }

    const candidateSelectors = 'h1,h2,h3,h4,p,li,blockquote,pre,code';
    const candidates = Array.from(root.querySelectorAll(candidateSelectors));
    const parts = [];
    let total = 0;

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (!isElementVisible(rect)) continue;
      const text = cleanText(el.innerText || '');
      if (!text) continue;
      parts.push(text);
      total += text.length + 1;
      if (total >= maxChars) break;
    }

    let snippet = parts.join('\n');
    if (!snippet) {
      snippet = cleanText(root.innerText || '');
    }

    return snippet.slice(0, maxChars);
  }

  function getPageInfo() {
    const url = window.location.href;
    const title = document.title || '';
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {}

    return {
      type: 'PAGE_INFO',
      url,
      title,
      domain,
      contextSnippet: extractVisibleSnippet(2000)
    };
  }

  async function isSignalsEnabled() {
    try {
      const stored = await chrome.storage.local.get([STATE_KEY]);
      const state = stored[STATE_KEY];
      return state?.signalsEnabled !== false;
    } catch {
      return true;
    }
  }

  async function updateRecentSignals(info) {
    if (!info.title || !info.url) return;
    if (!(await isSignalsEnabled())) return;

    let domain = info.domain || '';
    if (!domain) {
      try {
        domain = new URL(info.url).hostname;
      } catch {}
    }

    try {
      const stored = await chrome.storage.local.get([SIGNALS_KEY]);
      const signals = Array.isArray(stored[SIGNALS_KEY]) ? stored[SIGNALS_KEY] : [];
      if (signals.some(signal => signal.url === info.url)) return;

      signals.unshift({
        title: info.title,
        domain,
        url: info.url,
        timestamp: Date.now()
      });

      const trimmed = signals.slice(0, MAX_SIGNALS);
      await chrome.storage.local.set({ [SIGNALS_KEY]: trimmed });
    } catch (e) {
      console.warn('Failed to store recent signals:', e);
    }
  }

  async function sendPageInfo() {
    const info = getPageInfo();
    await updateRecentSignals(info);
    chrome.runtime.sendMessage(info).catch(() => {
      // Side panel might be closed
    });
  }

  // ===== Selection Bubble =====
  let bubbleEl = null;
  let lastSelectionText = '';

  function ensureBubble() {
    if (bubbleEl) return bubbleEl;
    bubbleEl = document.createElement('div');
    bubbleEl.id = 'ip-selection-bubble';
    bubbleEl.style.position = 'absolute';
    bubbleEl.style.zIndex = '2147483647';
    bubbleEl.style.display = 'none';
    bubbleEl.style.alignItems = 'center';
    bubbleEl.style.gap = '6px';
    bubbleEl.style.padding = '6px 8px';
    bubbleEl.style.background = 'rgba(20, 20, 20, 0.92)';
    bubbleEl.style.borderRadius = '999px';
    bubbleEl.style.boxShadow = '0 6px 18px rgba(0,0,0,0.25)';
    bubbleEl.style.color = '#fff';
    bubbleEl.style.fontSize = '12px';
    bubbleEl.style.userSelect = 'none';

    const actions = [
      { key: 'logic', label: '🔍 解构', color: '#1890ff' },
      { key: 'analogy', label: '🌈 类比', color: '#722ed1' },
      { key: 'deep', label: '⚡ 深挖', color: '#fa8c16' },
    ];

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.action = action.key;
      btn.textContent = action.label;
      btn.style.border = 'none';
      btn.style.background = action.color;
      btn.style.color = '#fff';
      btn.style.cursor = 'pointer';
      btn.style.padding = '4px 10px';
      btn.style.borderRadius = '12px';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = '500';
      btn.style.transition = 'all 0.15s ease';
      btn.style.boxShadow = `0 2px 6px ${action.color}50`;
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-1px)';
        btn.style.filter = 'brightness(1.1)';
        btn.style.boxShadow = `0 3px 10px ${action.color}60`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.filter = 'brightness(1)';
        btn.style.boxShadow = `0 2px 6px ${action.color}50`;
      });
      bubbleEl.appendChild(btn);
    });

    bubbleEl.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    bubbleEl.addEventListener('click', (event) => {
      const target = event.target;
      const btn = target instanceof HTMLElement ? target.closest('button') : null;
      if (!btn) return;
      const action = btn.dataset.action;
      if (!action || !lastSelectionText) return;
      chrome.runtime.sendMessage({
        type: 'SELECTION_ACTION',
        action,
        text: lastSelectionText,
        url: window.location.href,
        title: document.title
      }).catch(() => {});
      hideBubble();
    });

    document.body.appendChild(bubbleEl);
    return bubbleEl;
  }

  function hideBubble() {
    if (bubbleEl) {
      bubbleEl.style.display = 'none';
    }
  }

  function selectionInEditable(selection) {
    if (!selection || !selection.anchorNode) return false;
    const node = selection.anchorNode.nodeType === Node.ELEMENT_NODE
      ? selection.anchorNode
      : selection.anchorNode.parentElement;
    if (!node) return false;
    const editable = node.closest('input, textarea, [contenteditable="true"]');
    return Boolean(editable);
  }

  function showBubble() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideBubble();
      return;
    }

    if (selectionInEditable(selection)) {
      hideBubble();
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 4) {
      hideBubble();
      return;
    }

    const range = selection.rangeCount ? selection.getRangeAt(0) : null;
    if (!range) return;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;

    lastSelectionText = text;
    const bubble = ensureBubble();
    bubble.style.display = 'flex';

    // initial position above selection
    bubble.style.visibility = 'hidden';
    bubble.style.top = '0px';
    bubble.style.left = '0px';

    const bubbleWidth = bubble.offsetWidth || 160;
    const bubbleHeight = bubble.offsetHeight || 28;
    const centerX = rect.left + rect.width / 2;
    let top = window.scrollY + rect.top - bubbleHeight - 8;
    if (top < window.scrollY + 8) {
      top = window.scrollY + rect.bottom + 8;
    }
    let left = window.scrollX + centerX - bubbleWidth / 2;
    const maxLeft = window.scrollX + window.innerWidth - bubbleWidth - 8;
    if (left < window.scrollX + 8) left = window.scrollX + 8;
    if (left > maxLeft) left = maxLeft;

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
    bubble.style.visibility = 'visible';
  }

  document.addEventListener('mouseup', () => {
    setTimeout(showBubble, 40);
  });

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      hideBubble();
    }
  });

  document.addEventListener('mousedown', (event) => {
    if (!bubbleEl) return;
    if (event.target && bubbleEl.contains(event.target)) return;
    hideBubble();
  });

  window.addEventListener('scroll', hideBubble, true);
  window.addEventListener('resize', hideBubble);

  if (document.readyState === 'complete') {
    sendPageInfo();
  } else {
    window.addEventListener('load', sendPageInfo);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REQUEST_PAGE_INFO') {
      sendPageInfo();
      sendResponse({ success: true });
    }
    return true;
  });
})();
