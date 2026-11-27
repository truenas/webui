import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import {
  KeyboardShortcutDefinition, KeyboardShortcutId, keyboardShortcuts,
} from 'app/modules/keyboard-shortcut/keyboard-shortcuts.const';
import { DetectBrowserService } from 'app/services/detect-browser.service';

const nonTextInputTypes = new Set(['button', 'checkbox', 'color', 'file', 'image', 'radio', 'range', 'reset', 'submit']);

/**
 * Something modal is on top of the page: a dialog, a side panel, a menu or the search overlay.
 */
const openOverlaySelector = '.cdk-overlay-backdrop-showing, .cdk-dialog-container, .tn-side-panel__overlay--open';

/**
 * Listens for the shortcuts in `keyboardShortcuts` and runs the handler registered for each.
 */
@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService {
  private detectBrowser = inject(DetectBrowserService);
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  private handlers = new Map<KeyboardShortcutId, () => void>();

  constructor() {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onKeydown(event));
  }

  /**
   * Runs `handler` when the shortcut is pressed, until the returned function is called
   * or `destroyRef` is destroyed.
   *
   * The key press comes from a `document` listener, which does not mark any view for check:
   * `handler` must set signals or call `markForCheck()` for the change to render.
   */
  register(id: KeyboardShortcutId, handler: () => void, destroyRef?: DestroyRef): () => void {
    this.handlers.set(id, handler);
    const unregister = (): void => {
      if (this.handlers.get(id) === handler) {
        this.handlers.delete(id);
      }
    };
    destroyRef?.onDestroy(unregister);
    return unregister;
  }

  /**
   * Hint for a shortcut, e.g. "⌘ + B" on macOS and "Ctrl + B" elsewhere.
   */
  getHint(id: KeyboardShortcutId): string {
    const modifier = this.detectBrowser.isMacOs() ? '⌘' : 'Ctrl';
    return `${modifier} + ${keyboardShortcuts[id].key.toLocaleUpperCase()}`;
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.repeat || !this.hasOnlyCommandModifier(event)) {
      return;
    }

    const match = (Object.entries(keyboardShortcuts) as [KeyboardShortcutId, KeyboardShortcutDefinition][])
      .find(([, shortcut]) => shortcut.key === event.key);
    if (!match) {
      return;
    }

    const [id, shortcut] = match;
    const handler = this.handlers.get(id);
    if (!handler) {
      return;
    }
    if (!shortcut.allowInTextFields && this.isTextField(event.target)) {
      return;
    }
    if (!shortcut.allowWithOverlayOpen && this.document.querySelector(openOverlaySelector)) {
      return;
    }

    // Stop the browser's own action for the combo, e.g. Firefox opening bookmarks on Ctrl+B.
    event.preventDefault();
    handler();
  }

  private hasOnlyCommandModifier(event: KeyboardEvent): boolean {
    const isMacOs = this.detectBrowser.isMacOs();
    const commandPressed = isMacOs ? event.metaKey : event.ctrlKey;
    const otherPressed = isMacOs ? event.ctrlKey : event.metaKey;
    // Shift is not rejected outright: on many layouts it is needed to type keys like "/".
    const shiftedLetter = event.shiftKey && /^[a-z]$/i.test(event.key);
    return commandPressed && !otherPressed && !event.altKey && !shiftedLetter;
  }

  private isTextField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target instanceof HTMLInputElement) {
      return !nonTextInputTypes.has(target.type);
    }
    return target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target.isContentEditable
      || Boolean(target.closest('.cm-editor, [contenteditable="true"], [role="textbox"]'));
  }
}
