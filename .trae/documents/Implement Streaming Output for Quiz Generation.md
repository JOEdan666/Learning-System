I will implement **streaming output** for the quiz generation to solve the "too slow / timeout" perception issue.

### 1. Update `QuizStep.tsx` to Support Streaming
I will modify the `generateQuestionsFromAPI` function and the component UI:
*   **Backend Interaction**: Update the `fetch` call to append `?stream=true`.
*   **Stream Reading**: Implement a `ReadableStream` reader to capture the AI's response in real-time chunks.
*   **Visual Feedback**:
    *   Add a `streamingText` state variable.
    *   Replace the static "Loading..." spinner with a **"Real-time Generation" view**.
    *   Display the raw JSON being generated (e.g., `{"questions": [{"id": 1, "question": "..."`) in a code-like "terminal" window, so the user sees immediate progress.
*   **Completion Handling**: Once the stream finishes, parse the accumulated JSON string into the `questions` object and render the quiz card.

### 2. Verify
*   Trigger a new generation.
*   Confirm text appears immediately (streaming).
*   Confirm the final result is correctly parsed and interactive.