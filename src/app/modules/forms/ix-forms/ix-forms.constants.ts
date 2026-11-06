/**
 * Debounce for autocomplete suggestions and validation. The `ix-user-*` / `ix-group-*` pickers use it for
 * both search and existence checks, so a field doesn't query the directory on two clocks.
 */
export const defaultDebounceTimeMs = 300;
