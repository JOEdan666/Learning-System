// Background service worker for Intelligent Partner

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set side panel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content script and forward to side panel
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'SELECTION_CHANGED' || message.type === 'PAGE_INFO') {
    chrome.runtime.sendMessage(message).catch(() => {});
    return true;
  }

  if (message.type === 'SELECTION_ACTION') {
    const tabId = sender?.tab?.id;
    if (typeof tabId === 'number' && chrome.sidePanel?.open) {
      chrome.sidePanel.open({ tabId }).then(() => {
        // Give the side panel a moment to initialize
        setTimeout(() => {
          chrome.runtime.sendMessage(message).catch(() => {});
        }, 200);
      }).catch(() => {
        // If open fails, still try to send
        chrome.runtime.sendMessage(message).catch(() => {});
      });
    } else {
      chrome.runtime.sendMessage(message).catch(() => {});
    }
    return true;
  }

  return true;
});
