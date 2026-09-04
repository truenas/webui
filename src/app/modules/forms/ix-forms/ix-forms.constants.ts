/**
 * Default debounce time in milliseconds for autocomplete suggestions and validation.
 *
 * Used by `ix-chips`, `ix-combobox` and the `ix-user-*` / `ix-group-*` directory
 * pickers, for BOTH the search fetch and the existence validation — so a field
 * does not query the directory twice on different clocks.
 *
 * The 300ms value provides a balance between:
 * - Responsive UI (fast enough that users don't notice delay)
 * - API efficiency (prevents spamming backend on every keystroke)
 * - Accessibility (accommodates users who type more slowly)
 */
export const defaultDebounceTimeMs = 300;
