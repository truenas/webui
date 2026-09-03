/**
 * Default debounce time in milliseconds for autocomplete suggestions and validation.
 *
 * This value is used across ix-chips, ix-combobox, and their specialized wrappers
 * (the ix-user-* / ix-group-* pickers).
 *
 * The 300ms value provides a balance between:
 * - Responsive UI (fast enough that users don't notice delay)
 * - API efficiency (prevents spamming backend on every keystroke)
 * - Accessibility (accommodates users who type more slowly)
 *
 * Note: This constant controls BOTH autocomplete fetching AND validation debouncing
 * in specialized wrappers, ensuring consistent timing across both operations.
 */
export const defaultDebounceTimeMs = 300;
