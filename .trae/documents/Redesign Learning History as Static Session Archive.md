# Implementation Plan: Learning Session Archive & History Redesign

We will completely redesign the Learning History feature to provide a full "Session Archive" view that statically replays the learning content (Explanation, Quiz, Results) and integrates a context-aware AI chat bubble.

## 1. Create Floating Chat Widget
**File:** `app/components/FloatingChatWidget.tsx` (New)
- **Purpose:** A standalone, lightweight chat interface that sits in the bottom-right corner.
- **Features:**
  - Collapsible (Chat Bubble icon -> Chat Window).
  - Accepts a `context` prop to inject the session data (explanation, quiz results) into the AI's system prompt.
  - Uses `AIProvider` directly to communicate with the model.
  - Does not persist to the global conversation list (ephemeral for this review session) or can optionally save if needed (we will keep it ephemeral for simplicity first).

## 2. Create Session Archive Page
**File:** `app/learning-history/[id]/page.tsx` (New)
- **Purpose:** The detailed "replay" view of a specific learning session.
- **Data Fetching:**
  - Fetch full session details using `LearningProgressService.getCompleteLearningData`.
  - Extract `aiExplanation`, `quizQuestions`, `userAnswers`, `finalScore`.
- **UI Structure:**
  - **Header:** Subject, Topic, Grade, Date, Back button.
  - **Section 1: Knowledge Review:** Render the full `aiExplanation` Markdown text.
  - **Section 2: Quiz Review:**
    - List all questions.
    - Show the user's selected answer (highlighted Green if correct, Red if wrong).
    - Show the correct answer and the explanation.
  - **Floating Widget:** Instantiate `<FloatingChatWidget />` with the session content as context.

## 3. Refactor History List Page
**File:** `app/learning-history/page.tsx`
- **Changes:**
  - Remove the "Tabs" interface (Knowledge, Mistakes, Notes).
  - Focus on a clean, card-based list of **Learning Sessions**.
  - Clicking a session card navigates to `/learning-history/[id]` instead of opening a modal.

## 4. Verification
- **Test:** Create a new learning session, complete it, and then go to "Learning History".
- **Verify:** Click the session -> Ensure the new Archive page loads.
- **Verify:** Check that the Explanation text matches.
- **Verify:** Check that Quiz answers (correct/incorrect) are displayed accurately.
- **Verify:** Open the Chat Bubble and ask "Why is the answer to question 2 C?" and ensure the AI understands the context.
