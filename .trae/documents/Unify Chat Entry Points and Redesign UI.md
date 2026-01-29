I will unify the chat entry points and redesign the interface to match the user's request for a cleaner, ChatGPT-like experience.

**Plan:**

1. **Unify Chat Entry Points:**

   * Currently, there seem to be two chat pages: `/unified-chat` (using `UnifiedChat` component) and `/conversations` (using `ConversationList` + `ConversationView`).

   * I will deprecate `/conversations` and redirect it to `/unified-chat` to ensure a single, consistent entry point.

   * I will update the main navigation (`MainLayout.tsx`) to point "统一会话" (Unified Chat) and any other chat-related links solely to `/unified-chat`.

2. **Redesign UI (ChatGPT Style):**

   * I will further refine `UnifiedChat.tsx` to match the ChatGPT aesthetic described:

     * **Sidebar:** Dark/neutral tone, collapsible, listing history clearly.

     * **Main Area:** Clean white/light background.

     * **Input Area:** Centered at the bottom, floating with a clean shadow, not a full-width bar.

     * **Message Bubbles:** Remove heavy background colors. User messages should be clean (maybe just text or very subtle bg), AI messages should be transparent with an icon.

     * **Typography:** Improve font sizes and spacing for better readability.

**Action Plan:**

1. Modify `app/components/MainLayout.tsx` to update navigation links.
2. Redirect or remove `app/conversations/page.tsx` (or update it to use `UnifiedChat`).
3. Refine `app/components/UnifiedChat.tsx` CSS/Tailwind classes for the "ChatGPT look".

