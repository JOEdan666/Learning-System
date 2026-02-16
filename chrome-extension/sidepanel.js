(function() {
  'use strict';

  const API_BASE = 'http://localhost:3003/api/partner';
  const STORAGE_KEY = 'ip_world_state_v2';
  const SIGNALS_KEY = 'ip_recent_signals_v2';
  const MAX_SIGNALS = 5;

  const modeSelect = document.getElementById('mode-select');
  const topicInput = document.getElementById('topic-input');
  const goalInput = document.getElementById('goal-input');
  const topicRefresh = document.getElementById('topic-refresh');
  const contextTitle = document.getElementById('context-title');
  const contextDomain = document.getElementById('context-domain');
  const contextLink = document.getElementById('context-link');
  const suggestionsList = document.getElementById('suggestions-list');
  const askInput = document.getElementById('ask-input');
  const askSubmit = document.getElementById('ask-submit');
  const outputPanel = document.getElementById('output-panel');
  const outputEmpty = document.getElementById('output-empty');
  const outputMarkdown = document.getElementById('output-markdown');
  const followUpContainer = document.getElementById('follow-up-container');
  const loadingState = document.getElementById('loading-state');
  const loadingText = document.getElementById('loading-text');
  const lensValue = document.getElementById('lens-value');
  const emptyGreeting = document.getElementById('empty-greeting');
  const saveBtn = document.getElementById('save-btn');
  const clearBtn = document.getElementById('clear-btn');
  const saveStatus = document.getElementById('save-status');
  const sessionPill = document.getElementById('session-pill');

  // 认知透镜按钮系统
  const SUGGESTIONS = {
    Study: [
      { label: '逻辑解构', intent: 'logic_deconstruct', icon: '🔍', btnClass: 'logic' },
      { label: '跨界联觉', intent: 'cross_domain_analogy', icon: '🌈', btnClass: 'cross' },
      { label: '深挖引擎', intent: 'deep_dive', icon: '⚡', btnClass: 'deep' }
    ],
    Work: [
      { label: '逻辑解构', intent: 'logic_deconstruct', icon: '🔍', btnClass: 'logic' },
      { label: '风险透视', intent: 'risks', icon: '⚠️', btnClass: 'deep' },
      { label: '行动路径', intent: 'action_items', icon: '🎯', btnClass: 'cross' }
    ],
    Brainstorm: [
      { label: '跨界联觉', intent: 'cross_domain_analogy', icon: '🌈', btnClass: 'cross' },
      { label: '发散思维', intent: 'brainstorm', icon: '💡', btnClass: 'logic' },
      { label: '深挖引擎', intent: 'deep_dive', icon: '⚡', btnClass: 'deep' }
    ]
  };

  // 加载状态文案
  const LOADING_MESSAGES = [
    '正在思考...',
    '正在分析...',
    '正在解构...',
    '正在生成...',
  ];

  // 空状态问候语
  const GREETINGS = [
    '选择认知视角，开始探索',
    '准备好探索新知识了吗？',
    '有什么想深入了解的？',
  ];

  // Intent 名称映射（用于显示）
  const INTENT_DISPLAY_NAMES = {
    logic_deconstruct: '逻辑解构',
    cross_domain_analogy: '跨界联觉',
    deep_dive: '深挖引擎',
    clarify: '解释',
    structured_summary: '总结',
    quiz: '测验',
    risks: '风险透视',
    action_items: '行动路径',
    brainstorm: '发散思维'
  };

  let worldState = {
    mode: 'Study',
    topic: '',
    topicLocked: false,
    goal: '',
    context: {
      url: '',
      title: '',
      domain: '',
      snippet: ''
    },
    signalsEnabled: true,
    sessionId: ''
  };

  let recentSignals = [];
  let lastAskResult = null;
  let isLoading = false;

  function storageGet(keys) {
    return new Promise(resolve => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  function storageSet(items) {
    return new Promise(resolve => {
      chrome.storage.local.set(items, resolve);
    });
  }

  async function loadState() {
    try {
      const stored = await storageGet([STORAGE_KEY, SIGNALS_KEY]);
      const savedState = stored[STORAGE_KEY] || {};
      worldState = {
        ...worldState,
        ...savedState,
        context: {
          ...worldState.context,
          ...(savedState.context || {})
        }
      };
      recentSignals = Array.isArray(stored[SIGNALS_KEY]) ? stored[SIGNALS_KEY] : [];
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  async function saveState() {
    try {
      await storageSet({
        [STORAGE_KEY]: {
          mode: worldState.mode,
          topic: worldState.topic,
          topicLocked: worldState.topicLocked,
          goal: worldState.goal,
          context: worldState.context,
          signalsEnabled: worldState.signalsEnabled,
          sessionId: worldState.sessionId
        }
      });
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  async function saveSignals() {
    try {
      await storageSet({
        [SIGNALS_KEY]: recentSignals
      });
    } catch (e) {
      console.error('Failed to save signals:', e);
    }
  }

  function setupEventListeners() {
    modeSelect.addEventListener('change', () => {
      worldState.mode = modeSelect.value;
      saveState();
      renderSuggestions();
    });

    topicInput.addEventListener('input', () => {
      worldState.topic = topicInput.value.trim();
      worldState.topicLocked = true;
      saveState();
    });

    topicRefresh.addEventListener('click', () => {
      worldState.topicLocked = false;
      if (worldState.context.title) {
        worldState.topic = worldState.context.title;
      } else if (worldState.context.domain) {
        worldState.topic = worldState.context.domain;
      }
      topicInput.value = worldState.topic;
      saveState();
    });

    goalInput.addEventListener('input', () => {
      worldState.goal = goalInput.value.trim();
      saveState();
    });

    suggestionsList.addEventListener('click', (event) => {
      const btn = event.target.closest('.action-btn');
      if (!btn) return;
      const intent = btn.dataset.intent || 'custom';
      updateLensDisplay(intent);
      handleAsk(intent, btn.dataset.label || '');
    });

    // 后续问题点击事件
    followUpContainer.addEventListener('click', (event) => {
      const bubble = event.target.closest('.follow-up-bubble');
      if (!bubble) return;
      const question = bubble.dataset.question;
      if (question) {
        askInput.value = question;
        handleAsk('custom');
      }
    });

    askSubmit.addEventListener('click', () => handleAsk('custom'));

    askInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleAsk('custom');
      }
    });

    saveBtn.addEventListener('click', handleSave);
    clearBtn.addEventListener('click', handleClear);

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PAGE_INFO') {
        updateContext(message);
      }
      if (message.type === 'SELECTION_ACTION') {
        const action = message.action || 'logic';
        const text = message.text || '';
        if (text) {
          const intentMap = {
            logic: 'logic_deconstruct',
            analogy: 'cross_domain_analogy',
            deep: 'deep_dive'
          };
          const prefixMap = {
            logic: '请逻辑解构这段内容：',
            analogy: '请用跨领域类比解释这段内容：',
            deep: '请深入挖掘这段内容的本质：'
          };
          const intent = intentMap[action] || 'logic_deconstruct';
          updateLensDisplay(intent);
          askInput.value = `${prefixMap[action] || ''}${text}`;
          handleAsk(intent);
        }
      }
      return true;
    });

    if (chrome.tabs?.onActivated) {
      chrome.tabs.onActivated.addListener(() => requestPageInfo());
    }

    if (chrome.tabs?.onUpdated) {
      chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
        if (changeInfo.status === 'complete') {
          requestPageInfo();
        }
      });
    }

    // 当侧边栏获得焦点时刷新页面信息
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestPageInfo();
      }
    });

    // 窗口获得焦点时也刷新
    window.addEventListener('focus', () => {
      requestPageInfo();
    });
  }

  async function requestPageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;

      // 先用 tab 基础信息更新（这会触发新页面检测和 snippet 清空）
      if (tab.title || tab.url) {
        updateContext({
          url: tab.url || '',
          title: tab.title || '',
          contextSnippet: '' // 先清空，等 content script 返回完整内容
        });
      }

      // 向 content script 请求完整页面内容
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_PAGE_INFO' });
        } catch {
          // content script 可能未加载，等待后重试
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_PAGE_INFO' });
            } catch {
              // 仍然失败，使用基础信息即可
            }
          }, 500);
        }
      }
    } catch (e) {
      console.warn('Could not request page info:', e);
    }
  }

  function updateContext(info) {
    const newUrl = info.url || '';
    const isNewPage = newUrl && worldState.context.url && newUrl !== worldState.context.url;

    // 切换到新页面时，重置 session 和 snippet
    if (isNewPage) {
      worldState.sessionId = '';
      updateSessionPill('草稿');
    }

    const domain = info.domain || extractDomain(newUrl);
    if (domain && worldState.context.domain && domain !== worldState.context.domain) {
      worldState.topicLocked = false;
    }

    // 如果是新页面，清空旧的 snippet；否则保留
    const newSnippet = info.contextSnippet || info.pageSnippet || '';
    worldState.context = {
      url: newUrl,
      title: info.title || '',
      domain: domain,
      snippet: isNewPage ? newSnippet : (newSnippet || worldState.context.snippet || '')
    };

    if (!worldState.topicLocked && worldState.context.title) {
      worldState.topic = worldState.context.title;
    }

    saveState();
    renderContext();
  }

  function renderState() {
    modeSelect.value = worldState.mode;
    topicInput.value = worldState.topic;
    goalInput.value = worldState.goal;
    renderContext();
    renderSuggestions();
    updateSessionPill(worldState.sessionId ? '草稿' : '草稿');
  }

  function renderContext() {
    contextTitle.textContent = worldState.context.title || '等待页面...';
    contextDomain.textContent = worldState.context.domain || '';
    contextLink.href = worldState.context.url || '#';
    contextLink.style.display = worldState.context.url ? 'flex' : 'none';
  }


  function renderSuggestions() {
    const list = SUGGESTIONS[worldState.mode] || SUGGESTIONS.Study;
    suggestionsList.innerHTML = list
      .map(item => {
        const btnClass = item.btnClass || '';
        const icon = item.icon ? `<span class="btn-icon">${item.icon}</span>` : '';
        return `<button class="action-btn ${btnClass}" data-intent="${item.intent}" data-label="${escapeHtml(item.label)}">${icon}${escapeHtml(item.label)}</button>`;
      })
      .join('');
  }

  function updateLensDisplay(intent) {
    const displayName = INTENT_DISPLAY_NAMES[intent] || intent;
    if (lensValue) {
      lensValue.textContent = displayName;
    }
  }

  function getRandomLoadingMessage() {
    return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
  }

  function updateGreeting() {
    if (emptyGreeting) {
      const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      emptyGreeting.textContent = greeting;
    }
  }

  function parseFollowUpQuestions(fullText) {
    const regex = /\[FOLLOW_UP_QUESTIONS\]([\s\S]*?)\[\/FOLLOW_UP_QUESTIONS\]/;
    const match = fullText.match(regex);
    if (!match) return { cleanText: fullText, questions: [] };

    const cleanText = fullText.replace(regex, '').trim();
    const questionsBlock = match[1].trim();
    const questions = questionsBlock
      .split(/\n/)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 0);

    return { cleanText, questions };
  }

  function renderFollowUpBubbles(questions) {
    if (!followUpContainer) return;
    if (!questions || questions.length === 0) {
      followUpContainer.hidden = true;
      return;
    }

    followUpContainer.innerHTML = questions
      .map(q => `<button class="follow-up-bubble" data-question="${escapeHtml(q)}">${escapeHtml(q)}</button>`)
      .join('');
    followUpContainer.hidden = false;
  }


  async function ensureSession() {
    if (worldState.sessionId) return;

    const payload = {
      mode: worldState.mode,
      topic: worldState.topic,
      goal: worldState.goal,
      pageUrl: worldState.context.url,
      pageTitle: worldState.context.title,
      pageDomain: worldState.context.domain,
      contextSnippet: worldState.context.snippet,
      recentSignals
    };

    const response = await fetch(`${API_BASE}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Session create failed');
    }

    const data = await response.json();
    worldState.sessionId = data.sessionId;
    await saveState();
    updateSessionPill('草稿');
  }

  async function handleAsk(intent, presetText = '') {
    if (isLoading) return;

    isLoading = true;
    setLoading(true);
    clearStatus();

    // 显示加载状态
    if (loadingState && loadingText) {
      outputEmpty.hidden = true;
      outputMarkdown.hidden = true;
      if (followUpContainer) followUpContainer.hidden = true;
      loadingState.hidden = false;
      loadingText.textContent = getRandomLoadingMessage();
    }

    // 先刷新当前页面信息，确保上下文是最新的
    await requestPageInfo();

    const userText = askInput.value.trim() || presetText || getDefaultPrompt(intent);
    const outputFormat = 'markdown';

    try {
      await ensureSession();

      let response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: worldState.sessionId,
          intent,
          userText,
          worldState: buildWorldStatePayload(),
          outputFormat
        })
      });

      // 如果 session 不存在（404），自动重新创建
      if (response.status === 404) {
        worldState.sessionId = '';
        await ensureSession();
        response = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: worldState.sessionId,
            intent,
            userText,
            worldState: buildWorldStatePayload(),
            outputFormat
          })
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Ask failed');
      }

      // 隐藏加载状态，显示输出区域
      if (loadingState) loadingState.hidden = true;
      outputEmpty.hidden = true;
      outputMarkdown.hidden = false;
      outputMarkdown.innerHTML = '<span class="cursor">▊</span>';

      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        const { cleanText, questions } = parseFollowUpQuestions(text);
        lastAskResult = { markdown: cleanText };
        renderOutput({ markdown: cleanText });
        renderFollowUpBubbles(questions);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        fullText += chunk;
        // 在流式输出时，暂时不解析后续问题
        outputMarkdown.innerHTML = renderMarkdown(fullText) + '<span class="cursor">▊</span>';
      }

      // 流式完成后，解析后续问题
      const { cleanText, questions } = parseFollowUpQuestions(fullText);
      outputMarkdown.innerHTML = renderMarkdown(cleanText);
      lastAskResult = { markdown: cleanText };
      renderFollowUpBubbles(questions);
    } catch (e) {
      if (loadingState) loadingState.hidden = true;
      renderError('请求失败，请重试');
      console.error('Ask error:', e);
    } finally {
      isLoading = false;
      setLoading(false);
    }
  }

  function buildWorldStatePayload() {
    return {
      mode: worldState.mode,
      topic: worldState.topic,
      goal: worldState.goal,
      context: {
        url: worldState.context.url,
        title: worldState.context.title,
        domain: worldState.context.domain,
        snippet: worldState.context.snippet
      },
      recentSignals
    };
  }

  function renderOutput(data) {
    outputEmpty.hidden = true;
    outputMarkdown.hidden = false;
    outputMarkdown.innerHTML = renderMarkdown(data.markdown || data.content || '');

    outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderError(message) {
    outputEmpty.hidden = true;
    outputMarkdown.hidden = false;
    outputMarkdown.innerHTML = `<p class="error-text">${escapeHtml(message)}</p>`;
  }

  async function handleSave() {
    if (!worldState.sessionId) {
      showStatus('请先生成一次输出');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>保存中...</span>';

    try {
      const response = await fetch(`${API_BASE}/session/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: worldState.sessionId })
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const data = await response.json();
      updateSessionPill('saved');
      showStatus('已保存');
      saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> 已保存';
      setTimeout(() => {
        resetSaveBtn();
      }, 2000);
    } catch (e) {
      console.error('Save error:', e);
      showStatus('保存失败');
      saveBtn.innerHTML = '重试';
      setTimeout(() => {
        resetSaveBtn();
      }, 2000);
    }
  }

  function resetSaveBtn() {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4.414a1 1 0 0 0-.293-.707l-2.414-2.414A1 1 0 0 0 11.586 1H2zm3 4a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 5zm0 3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 8z"/></svg> 保存';
  }

  function handleClear() {
    outputMarkdown.hidden = true;
    outputEmpty.hidden = false;
    if (followUpContainer) followUpContainer.hidden = true;
    if (loadingState) loadingState.hidden = true;
    askInput.value = '';
    lastAskResult = null;
    worldState.sessionId = '';
    saveState();
    updateSessionPill('草稿');
    updateGreeting();
    updateLensDisplay('logic_deconstruct');
    showStatus('已清空');
  }

  function updateSessionPill(status) {
    const isSaved = status === 'saved' || status === '已保存';
    sessionPill.textContent = isSaved ? '已保存' : '草稿';
    sessionPill.className = isSaved ? 'status-pill saved' : 'status-pill';
  }

  function setLoading(loading) {
    if (loading) {
      askSubmit.disabled = true;
      outputPanel.classList.add('loading');
    } else {
      askSubmit.disabled = false;
      outputPanel.classList.remove('loading');
    }
  }

  function showStatus(message) {
    saveStatus.textContent = message;
  }

  function clearStatus() {
    saveStatus.textContent = '';
  }

  function getDefaultPrompt(intent) {
    const prompts = {
      // 新认知透镜
      logic_deconstruct: '请逻辑解构当前内容，指出核心逻辑和推理链条',
      cross_domain_analogy: '请用跨领域的新颖类比来解释当前内容',
      deep_dive: '请深入挖掘当前内容的本质，追问为什么',
      // 原有
      clarify: '帮我澄清并梳理当前内容',
      next_steps: '给我下一步行动建议',
      brainstorm: '围绕目标发散一些想法',
      structured_summary: '请结构化提炼核心要点',
      concept_relations: '请梳理概念关系和层级',
      key_points: '请提炼关键点',
      quiz: '请生成几个测验问题',
      executive_summary: '请给出结论摘要',
      risks: '请识别风险点',
      action_items: '请给出行动项',
      compare: '请做对比',
      diverge: '请给出发散方向',
      constraints: '请列出约束条件',
      mvp_path: '请给出 MVP 路线',
      counter_examples: '请给出反例'
    };
    return prompts[intent] || '帮我分析一下';
  }

  function extractDomain(url) {
    if (!url) return '';
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMarkdown(text) {
    if (!text) return '';
    const segments = text.split(/```/);
    let html = '';
    segments.forEach((segment, index) => {
      if (index % 2 === 1) {
        const cleaned = segment.replace(/^\w+\n/, '');
        html += `<pre><code>${escapeHtml(cleaned)}</code></pre>`;
      } else {
        html += renderMarkdownInline(segment);
      }
    });
    return html;
  }

  function renderMarkdownInline(text) {
    const lines = text.split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
      if (inUl) {
        html += '</ul>';
        inUl = false;
      }
      if (inOl) {
        html += '</ol>';
        inOl = false;
      }
    };

    // 预处理：修复常见的 AI 输出格式问题
    const preprocessLine = (line) => {
      let processed = line;
      // 修复 "*2. 内容" -> "2. 内容"
      processed = processed.replace(/^\s*\*(\d+\.)\s*/, '$1 ');
      // 修复 "* 2. 内容" -> "2. 内容"
      processed = processed.replace(/^\s*\*\s+(\d+\.)\s*/, '$1 ');
      // 修复 "-2. 内容" -> "2. 内容"
      processed = processed.replace(/^\s*-(\d+\.)\s*/, '$1 ');
      // 修复 "1.内容" -> "1. 内容"
      processed = processed.replace(/^(\d+\.)(?!\s)/, '$1 ');
      // 修复 "-内容" -> "- 内容"
      processed = processed.replace(/^([-*])(?!\s)/, '$1 ');
      return processed;
    };

    lines.forEach(line => {
      const trimmed = preprocessLine(line.trim());
      if (!trimmed) {
        closeLists();
        return;
      }

      if (/^#{1,4}\s+/.test(trimmed)) {
        closeLists();
        const level = Math.min(trimmed.match(/^#+/)?.[0].length || 1, 4);
        const content = trimmed.replace(/^#{1,4}\s+/, '');
        html += `<h${level}>${applyInlineMarkdown(content)}</h${level}>`;
        return;
      }

      if (/^>\s*/.test(trimmed)) {
        closeLists();
        html += `<blockquote>${applyInlineMarkdown(trimmed.replace(/^>\s*/, ''))}</blockquote>`;
        return;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (!inUl) {
          closeLists();
          html += '<ul>';
          inUl = true;
        }
        html += `<li>${applyInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''))}</li>`;
        return;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        if (!inOl) {
          closeLists();
          html += '<ol>';
          inOl = true;
        }
        html += `<li>${applyInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}</li>`;
        return;
      }

      closeLists();
      html += `<p>${applyInlineMarkdown(trimmed)}</p>`;
    });

    closeLists();
    return html;
  }

  function applyInlineMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return html;
  }


  async function init() {
    await loadState();
    setupEventListeners();
    renderState();
    requestPageInfo();
    updateGreeting();
  }

  init();
})();
