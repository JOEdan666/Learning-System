I will modify `app/services/conversationService.ts` to address the issues of repetitive conversation titles and duplicate messages.

**Plan:**

1. **Prevent Duplicate Messages:**

   * In `ConversationService.addMessage`, I will add a check to compare the new message with the last message in the conversation history.

   * If the role and content are identical, the method will return early, preventing the duplicate from being saved to `localStorage`. This solves the issue where re-entering a chat shows double answers.

2. **Fix Repetitive Titles:**

   * In `ConversationService.generateTitle`, I will instantiate a **new** `AIProvider` for each request instead of using a shared singleton instance. This prevents potential state pollution or callback conflicts if multiple title generations (or other AI tasks) happen concurrently.

   * I will add logic to detect and fix "doubled strings" (e.g., "SmartSmart" -> "Smart") in the generated title.

   * I will refine the AI prompt to explicitly request no repetition and a concise output.

3. **Verification:**

   * These changes will be implemented in `app/services/conversationService.ts`. No changes are strictly required in `UnifiedChat.tsx` as the service-level fix is more robust.

**Actions:**

* Edit `app/services/conversationService.ts` to implement the above logic.

