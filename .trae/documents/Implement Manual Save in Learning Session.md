I will modify `app/components/LearningFlow/LearningSession.tsx` to implement the manual save functionality and address the "save failed" issue.

**Plan:**

1. **Add Manual Save Function:**

   * Implement `handleManualSave` in `LearningSession.tsx`.

   * This function will gather the current session state (including quiz results if available) and call `LearningProgressClient.saveLearningProgress`.

   * It will provide clear `toast` feedback: "进度已保存" (Success) or "保存失败: \[Error]" (Error).

2. **Add UI Button:**

   * Insert a "保存进度" (Save Progress) button in the header section of the `LearningSession` component (next to the "Exit" button).

   * This enables the "manual save" feature the user requested.

3. **Verification:**

   * The explicit error message in the toast will help debug the underlying cause of the "Save Failed" issue (e.g., database connection, missing fields) if it persists.

