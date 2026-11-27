import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export interface KeyboardShortcutDefinition {
  /**
   * Value of `KeyboardEvent.key` pressed together with ⌘ (macOS) or Ctrl (elsewhere).
   * Never use combos the browser reserves (T, W, N, Tab): they cannot be overridden.
   */
  key: string;
  description: string;
  /**
   * Whether the shortcut also fires while focus is in a text field.
   */
  allowInTextFields?: boolean;
  /**
   * Whether the shortcut also fires while a dialog, side panel or other modal overlay is open.
   */
  allowWithOverlayOpen?: boolean;
}

/**
 * Every app-wide keyboard shortcut, in one place, so that they don't collide and can be listed together.
 * Register a handler for one with `KeyboardShortcutService.register()`.
 */
export const keyboardShortcuts = {
  globalSearch: {
    key: '/',
    description: T('Search UI'),
    allowInTextFields: true,
    allowWithOverlayOpen: true,
  },
  toggleSidenav: {
    key: 'b',
    description: T('Show or hide the side menu'),
  },
} satisfies Record<string, KeyboardShortcutDefinition>;

export type KeyboardShortcutId = keyof typeof keyboardShortcuts;
