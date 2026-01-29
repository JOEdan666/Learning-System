I will revamp the `UnifiedChat` interface and fix the functional issues to match the user's expectations for a modern, ChatGPT-like experience.

**Plan:**

1. **Fix Auto-Naming Logic:**

   * Verify that `generateTitle` is called correctly.

   * Update `UnifiedChat.tsx` to refresh the conversation list *immediately* after a new title is generated, ensuring the UI reflects the change without a manual refresh.

2. **Enhance Markdown Rendering (`TableRenderer.tsx`):**

   * The current `normalizeMarkdownSpacing` is overly aggressive (e.g., replacing "。" with "." globally), which breaks Chinese punctuation. I will remove or relax these replacements.

   * I will ensure `react-markdown` is correctly configured with `remark-gfm` and `remark-breaks` (to support soft line breaks) and that the Tailwind `prose` class is effectively applying styles (e.g., list styles, spacing).

3. **Implement Smart Auto-Scroll:**

   * In `UnifiedChat.tsx`, I will modify the `useEffect` that triggers scrolling.

   * Instead of blindly calling `scrollToBottom`, I will check if the user is already near the bottom (within a threshold, e.g., 100px). If they have scrolled up to read history, I will *not* auto-scroll, but perhaps show a "New message ↓" button.

4. **UI/UX Overhaul (ChatGPT-style):**

   * **Sidebar:** Add a toggle button (hamburger menu) to collapse/expand the conversation history sidebar.

   * **Main Layout:** Center the chat container with a max-width (e.g., `max-w-3xl`) for better readability on large screens.

   * **Input Area:** Redesign the input box to float at the bottom with a shadow, rounded corners, and auto-growing textarea, mimicking the ChatGPT input style.

   * **Message Bubbles:** Remove the "chat bubble" background for AI messages (keep it clean/transparent) and use avatars. Ensure User messages have a distinct but subtle background.

**Action Plan:**

1. Refactor `TableRenderer.tsx` to fix text normalization issues.
2. Refactor `UnifiedChat.tsx` to implement smart scrolling, sidebar toggle, and new layout styles.
3. Verify title generation UI updates.

