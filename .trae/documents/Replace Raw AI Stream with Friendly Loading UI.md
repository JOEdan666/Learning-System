# Fix: Hide Raw AI Stream Output in Quiz Generation

The user reported that the "AI Reasoning Stream" (the black terminal box showing raw JSON code) is confusing and looks like a bug. We will replace this technical debug view with a user-friendly loading interface.

## 1. Modify `app/components/LearningFlow/QuizStep.tsx`

### Changes:
1.  **Remove the "AI Reasoning Stream" Terminal UI:**
    - Delete the code block (lines 440-454) that renders the black `bg-slate-900` terminal box containing `streamingText`.
    
2.  **Enhance the Loading State:**
    - Replace the removed terminal with a cleaner, friendlier UI.
    - Add a list of **Loading Steps** that cycle or display to show progress without showing code.
    - Example steps:
      - "正在分析考点..." (Analyzing knowledge points)
      - "正在构建题目架构..." (Structuring questions)
      - "正在生成选项与解析..." (Generating options and explanations)
      - "正在进行最终校对..." (Finalizing)

### Technical Details:
- We will keep the `streamingText` state variable as it is used for logic (accumulating the response), but we simply won't render it to the user.
- We will add a simple `useEffect` to cycle through the loading messages based on time or just display a static friendly message with a nice animation.

## 2. Verification
- Trigger quiz generation.
- Confirm the black terminal box is gone.
- Confirm the new friendly loading UI appears.
- Confirm the quiz still generates successfully after the loading finishes.
