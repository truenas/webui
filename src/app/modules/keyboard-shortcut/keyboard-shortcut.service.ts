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

  /**
   * Handlers per shortcut, newest last. Only the newest runs, so a later registration takes over
   * and hands back to the earlier one when it unregisters.
   */
  private handlers = new Map<KeyboardShortcutId, (() => void)[]>();

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
    const entry = (): void => handler();
    this.handlers.set(id, [...(this.handlers.get(id) ?? []), entry]);
    const unregister = (): void => {
      this.handlers.set(id, (this.handlers.get(id) ?? []).filter((registered) => registered !== entry));
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
      .find(([, shortcut]) => this.matchesKey(event, shortcut.key));
    if (!match) {
      return;
    }

    const [id, shortcut] = match;
    const handler = this.handlers.get(id)?.at(-1);
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
    const shiftedLetter = event.shiftKey && (/^[a-z]$/i.test(event.key) || event.code?.startsWith('Key'));
    return commandPressed && !otherPressed && !event.altKey && !shiftedLetter;
  }

  private matchesKey(event: KeyboardEvent, key: string): boolean {
    // Lower-cased, so the shortcut still works with Caps Lock on (Shift is rejected earlier).
    const pressed = event.key.toLowerCase();
    if (pressed === key) {
      return true;
    }
    // On a non-Latin layout (e.g. Ctrl+B gives "и" on Russian) fall back to the physical key.
    // Only then: on Latin layouts such as Dvorak the letter moves, and `event.key` is what the user meant.
    const isLatinLetter = /^[a-z]$/.test(key);
    const pressedNonLatin = pressed.length === 1 && !/^[\x20-\x7e]$/.test(pressed);
    return isLatinLetter && pressedNonLatin && event.code === `Key${key.toUpperCase()}`;
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
