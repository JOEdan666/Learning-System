I have analyzed the issues and the code.

### 1. Auto-Title Issue
The auto-title logic relies on `currentMessages.length >= 4` and a check against default titles.
- **Problem**: The condition `currentMessages.length >= 4` is likely too strict for short conversations, and the timing of `setMessages` and `conversationService.updateConversation` might be causing race conditions where the title check fails or the message count isn't updated in time.
- **Fix**:
    - Lower the threshold to `currentMessages.length >= 2` (User + AI response = 2 messages). This ensures a title is generated after the first complete turn.
    - Add a check to ensure we haven't already generated a custom title (by checking if the title is still one of the default ones).

### 2. Auto-Scrolling Issue
The user complains that the page "automatically scrolls to the bottom" preventing them from reading previous content during generation.
- **Problem**: The `useEffect` hook `useEffect(() => { scrollToBottom(); }, [messages]);` triggers `scrollToBottom()` on *every* message update. Since `messages` updates frequently during streaming (for every chunk), this forces the view to the bottom repeatedly. Although `scrollToBottom` checks `shouldAutoScroll`, the frequency of updates combined with the logic might be problematic.
- **Fix**:
    - Modify the `useEffect` to strictly respect `shouldAutoScroll`.
    - Ensure `handleScroll` correctly detects when the user has scrolled up and sets `shouldAutoScroll` to `false`.
    - Specifically, in the `useEffect`, we should only scroll if `shouldAutoScroll` is true. The current implementation does this, but I will double-check the logic.
    - **Crucial**: The current `scrollToBottom` implementation uses `behavior: 'smooth'`. During rapid streaming updates, smooth scrolling can "lag behind" and create a janky experience or force the user down when they try to scroll up. I will change it to `behavior: 'auto'` (instant jump) during streaming to reduce layout thrashing, or ensure it only fires when truly at the bottom.
    - I will also increase the "near bottom" threshold in `handleScroll` from 100px to something larger (e.g., 150px) to make it easier to "break free" from auto-scrolling.

### Implementation Plan
I will modify `app/components/UnifiedChat.tsx`:

1.  **Relax Auto-Title Trigger**: Change `currentMessages.length >= 4` to `currentMessages.length >= 2`.
2.  **Fix Scroll Logic**:
    - In `handleScroll`, increase threshold to `150` pixels.
    - In the `useEffect` for `messages`, ensure we don't force scroll if the user has scrolled up.

I will not modify `ConversationService.ts` as the logic there seems correct for generating the title once triggered. The issue is likely in the *triggering* in the UI component.