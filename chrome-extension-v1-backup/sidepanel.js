// Intelligent Partner - Side Panel Logic

(function() {
  'use strict';

  const API_BASE = 'http://localhost:3003/api/extension';
  const STORAGE_KEY = 'ip_world_state';
  const SIGNALS_KEY = 'ip_recent_signals';
  const MAX_SIGNALS = 5;

  // ========== DOM Elements ==========
  const modeButtons = document.querySelectorAll('.mode-btn');
  const topicInput = document.getElementById('topic-input');
  const goalInput = document.getElementById('goal-input');
  const contextTitle = document.getElementById('context-title');
  const contextDomain = document.getElementById('context-domain');
  const signalsToggle = document.getElementById('signals-toggle');
  const signalsList = document.getElementById('signals-list');
  const askInput = document.getElementById('ask-input');
  const intentButtons = document.querySelectorAll('.intent-btn');
  const outputArea = document.getElementById('output-area');
  const conclusionContent = document.getElementById('conclusion-content');
  const reasoningContent = document.getElementById('reasoning-content');
  const outputReasoning = document.getElementById('output-reasoning');
  const actionsList = document.getElementById('actions-list');
  const citationsList = document.getElementById('citations-list');
  const footer = document.getElementById('footer');
  const saveBtn = document.getElementById('save-btn');
  const clearBtn = document.getElementById('clear-btn');

  // ========== State ==========
  let worldState = {
    mode: 'Study',
    topic: '',
    topicLocked: false,
    goal: '',
    context: { url: '', title: '', domain: '', pageSnippet: '' },
    recentSignals: [],
    signalsEnabled: true
  };

  let lastAskResult = null;
  let isLoading = false;

  // ========== Initialize ==========
  function init() {
    loadState();
    setupEventListeners();
    requestPageInfo();
    renderState();
  }

  // ========== Storage ==========
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        worldState.mode = parsed.mode || 'Study';
        worldState.goal = parsed.goal || '';
        worldState.topic = parsed.topic || '';
        worldState.topicLocked = parsed.topicLocked || false;
        worldState.signalsEnabled = parsed.signalsEnabled !== false;
      }

      const signals = localStorage.getItem(SIGNALS_KEY);
      if (signals) {
        worldState.recentSignals = JSON.parse(signals) || [];
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode: worldState.mode,
        topic: worldState.topic,
        topicLocked: worldState.topicLocked,
        goal: worldState.goal,
        signalsEnabled: worldState.signalsEnabled
      }));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  function saveSignals() {
    try {
      localStorage.setItem(SIGNALS_KEY, JSON.stringify(worldState.recentSignals));
    } catch (e) {
      console.error('Failed to save signals:', e);
    }
  }

  // ========== Event Listeners ==========
  function setupEventListeners() {
    // Mode switching
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        worldState.mode = btn.dataset.mode;
        saveState();
        renderModeButtons();
      });
    });

    // Topic editing (locks auto-update)
    topicInput.addEventListener('input', () => {
      worldState.topic = topicInput.value;
      worldState.topicLocked = true;
      saveState();
    });

    // Goal editing
    goalInput.addEventListener('input', () => {
      worldState.goal = goalInput.value;
      saveState();
    });

    // Signals toggle
    signalsToggle.addEventListener('click', toggleSignals);

    // Intent buttons
    intentButtons.forEach(btn => {
      btn.addEventListener('click', () => handleAsk(btn.dataset.intent));
    });

    // Save & Clear
    saveBtn.addEventListener('click', handleSave);
    clearBtn.addEventListener('click', handleClear);

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PAGE_INFO') {
        updateContext(message);
        addSignal(message);
      }
      return true;
    });

    // Listen for tab changes
    chrome.tabs.onActivated.addListener(() => {
      requestPageInfo();
    });

    // Listen for tab URL changes
    chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
      if (changeInfo.status === 'complete') {
        requestPageInfo();
      }
    });
  }

  // ========== Page Info ==========
  async function requestPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        contextTitle.textContent = '无法读取页面';
        return;
      }

      // Use tab info as immediate fallback
      if (tab.title || tab.url) {
        updateContext({
          url: tab.url || '',
          title: tab.title || '',
          pageSnippet: ''
        });
      }

      // Try to get more info from content script (with retry)
      if (tab.id) {
        let retries = 3;
        const tryRequest = () => {
          chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_PAGE_INFO' }).catch(() => {
            if (retries > 0) {
              retries--;
              setTimeout(tryRequest, 500);
            }
          });
        };
        tryRequest();
      }
    } catch (e) {
      console.log('Could not request page info:', e);
      contextTitle.textContent = '无法读取页面';
    }
  }

  function updateContext(info) {
    // Check if we should reset topic lock (new domain)
    if (info.url) {
      checkAndResetTopicLock(info.url);
    }

    worldState.context = {
      url: info.url || '',
      title: info.title || '',
      domain: '',
      pageSnippet: info.pageSnippet || ''
    };

    try {
      worldState.context.domain = new URL(info.url).hostname;
    } catch {}

    // Auto-update topic if not locked
    if (!worldState.topicLocked && info.title) {
      worldState.topic = info.title;
      topicInput.value = info.title;
      saveState();
    }

    renderContext();
  }

  // Reset topic lock when navigating to a new page (different domain)
  function checkAndResetTopicLock(newUrl) {
    try {
      const newDomain = new URL(newUrl).hostname;
      const oldDomain = worldState.context.domain;
      if (oldDomain && newDomain !== oldDomain) {
        worldState.topicLocked = false;
        saveState();
      }
    } catch {}
  }

  function addSignal(info) {
    if (!info.title || !info.url) return;

    let domain = '';
    try {
      domain = new URL(info.url).hostname;
    } catch {}

    // Avoid duplicates (same URL)
    const exists = worldState.recentSignals.some(s => s.url === info.url);
    if (exists) return;

    worldState.recentSignals.unshift({
      title: info.title,
      domain: domain,
      url: info.url,
      timestamp: Date.now()
    });

    // Keep only MAX_SIGNALS
    worldState.recentSignals = worldState.recentSignals.slice(0, MAX_SIGNALS);
    saveSignals();
    renderSignals();
  }

  // ========== Render Functions ==========
  function renderState() {
    renderModeButtons();
    topicInput.value = worldState.topic;
    goalInput.value = worldState.goal;
    renderContext();
    renderSignals();
  }

  function renderModeButtons() {
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === worldState.mode);
    });
  }

  function renderContext() {
    contextTitle.textContent = worldState.context.title || '等待页面...';
    contextDomain.textContent = worldState.context.domain || '';
  }

  function renderSignals() {
    if (worldState.recentSignals.length === 0) {
      signalsList.innerHTML = '<div class="signal-item"><span class="signal-title" style="color:#999">暂无记录</span></div>';
      return;
    }

    signalsList.innerHTML = worldState.recentSignals.map(signal => {
      const time = formatTime(signal.timestamp);
      return `
        <div class="signal-item">
          <span class="signal-title">${escapeHtml(signal.title)}</span>
          <span class="signal-domain">${escapeHtml(signal.domain)}</span>
          <span class="signal-time">${time}</span>
        </div>
      `;
    }).join('');
  }

  function toggleSignals() {
    const isOpen = signalsList.style.display !== 'none';
    signalsList.style.display = isOpen ? 'none' : 'block';
    signalsToggle.querySelector('.toggle-icon').classList.toggle('open', !isOpen);
  }

  // ========== Ask Handler ==========
  async function handleAsk(intent) {
    if (isLoading) return;

    isLoading = true;
    intentButtons.forEach(btn => btn.classList.add('loading'));
    outputArea.style.display = 'block';
    footer.style.display = 'none';

    // 隐藏不需要的区域，只显示结论区
    outputReasoning.style.display = 'none';
    document.getElementById('output-actions').style.display = 'none';
    document.getElementById('output-citations').style.display = 'none';

    // Show loading
    conclusionContent.innerHTML = '<div class="loading-text">正在思考...</div>';

    const userInput = askInput.value.trim() || getDefaultPrompt(intent);

    try {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: worldState.mode,
          topic: worldState.topic,
          goal: worldState.goal,
          context: worldState.context,
          userInput: userInput,
          intent: intent
        })
      });

      if (!response.ok) throw new Error('API error');

      // 流式处理纯文本响应
      await handleStreamResponse(response);

      footer.style.display = 'flex';
    } catch (e) {
      console.error('Ask error:', e);
      conclusionContent.innerHTML = '<div class="error-text">请求失败，请重试</div>';
    } finally {
      isLoading = false;
      intentButtons.forEach(btn => btn.classList.remove('loading'));
    }
  }

  async function handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    // 显示流式光标
    conclusionContent.innerHTML = '<span class="streaming-text"></span>';
    const streamingEl = conclusionContent.querySelector('.streaming-text');

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // 实时更新显示（转换 markdown 风格的换行）
        streamingEl.innerHTML = formatResponse(fullText) + '<span class="cursor">▊</span>';

        // 自动滚动到底部
        outputArea.scrollTop = outputArea.scrollHeight;
      }
    } catch (e) {
      console.error('Stream read error:', e);
    }

    // 最终渲染（移除光标）
    conclusionContent.innerHTML = formatResponse(fullText);
    lastAskResult = { content: fullText };
  }

  // 格式化响应文本（简单的 markdown 处理）
  function formatResponse(text) {
    if (!text) return '';

    // 转义 HTML
    let html = escapeHtml(text);

    // 处理标题 (## 或 ###)
    html = html.replace(/^### (.+)$/gm, '<h4 class="response-h4">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="response-h3">$1</h3>');

    // 处理粗体 **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 处理列表项 - 或 *
    html = html.replace(/^[\-\*] (.+)$/gm, '<div class="response-li">• $1</div>');

    // 处理数字列表 1. 2. 3.
    html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="response-li"><span class="li-num">$1.</span> $2</div>');

    // 换行转 <br>
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  function renderAskResult(data) {
    // 简化版本 - 直接显示内容
    if (data.content) {
      conclusionContent.innerHTML = formatResponse(data.content);
    } else if (data.conclusion) {
      conclusionContent.textContent = data.conclusion;
    }
  }

  function getDefaultPrompt(intent) {
    const prompts = {
      'clarify': '帮我澄清和梳理当前的内容',
      'next-steps': '给我下一步的行动建议',
      'brainstorm': '围绕当前目标发散一些想法'
    };
    return prompts[intent] || '帮我分析一下';
  }

  // ========== Save & Clear ==========
  async function handleSave() {
    if (!lastAskResult) return;

    saveBtn.textContent = '保存中...';
    saveBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/save-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldState: worldState,
          userInput: askInput.value.trim(),
          intent: 'custom',
          result: lastAskResult
        })
      });

      if (response.ok) {
        saveBtn.textContent = '✓ 已保存';
        setTimeout(() => {
          saveBtn.textContent = '💾 Save to Web';
          saveBtn.disabled = false;
        }, 2000);
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      console.error('Save error:', e);
      saveBtn.textContent = '保存失败';
      setTimeout(() => {
        saveBtn.textContent = '💾 Save to Web';
        saveBtn.disabled = false;
      }, 2000);
    }
  }

  function handleClear() {
    outputArea.style.display = 'none';
    footer.style.display = 'none';
    askInput.value = '';
    lastAskResult = null;
  }

  // ========== Utilities ==========
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
  }

  // Start
  init();

})();
