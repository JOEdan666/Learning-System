I will completely overhaul the Markdown rendering system to meet professional standards, addressing the user's complaints about poor layout ("dog shit") and weird artifacts ("letter taking up a whole line").

### 1. Robust Content Pre-processing (The "Cleaner")
I will implement a sophisticated `preprocessContent` function to handle common LLM formatting errors *before* they reach the renderer.
- **Header Fixes**: Force space after `#` (e.g., `###Title` -> `### Title`).
- **LaTeX Fixes**: Ensure block formulas `\[ ... \]` have surrounding newlines to prevent them from merging with text.
- **List Fixes**: Ensure list markers (`-`, `1.`) are followed by spaces.
- **Space Normalization**: Fix CJK (Chinese-Japanese-Korean) characters getting stuck to English/Numbers without spacing.

### 2. Smart Code Block Handling (The "Anti-Clutter" Logic)
This is the key fix for "letter taking up a whole line".
- **Detection**: I will check if a code block is "fake" (short content, no language specified, single line).
- **Rendering**:
    - **Real Code**: Render with full syntax highlighting, line numbers, and copy button (Mac-style window).
    - **Fake Code/Short Snippets**: Downgrade to a simple inline `<code>` look-alike or a very subtle gray box *without* the heavy header bar. This prevents a single "A" from becoming a giant block.

### 3. Professional Typography (The "Pro" Look)
I will refine the `Tailwind Typography` (`prose`) config.
- **Tables**: Wrap tables in a `overflow-x-auto` container with a modern, bordered design (striped rows, clear headers) to fix mobile layout issues.
- **Fonts**: Optimize for mixed Chinese/English display.
- **Spacing**: Adjust margins for headers, paragraphs, and lists to create a comfortable reading rhythm (breathable whitespace).

### 4. Component Upgrades
- **Math**: Ensure `KaTeX` is properly styled and vertically aligned with text.
- **Images**: Add rounded corners and subtle shadows to all images.
- **Links**: Make them blue and hoverable, opening in new tabs by default.

This plan moves from "patching bugs" to "implementing a design system" for the chat content.