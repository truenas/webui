import { Injectable } from '@angular/core';

/**
 * Copies text to the clipboard, including over plain HTTP.
 *
 * `navigator.clipboard` is gated on a *secure context*, so on an appliance
 * reached as `http://<address>/` it is not merely restricted — it is
 * `undefined`. Reading `.writeText` off it throws `TypeError: Cannot read
 * properties of undefined`, and it throws *synchronously*, before any promise
 * exists, so a caller's `.then(onSuccess, onError)` never runs and the user
 * gets an unhandled error instead of the failure message written for them.
 *
 * That is not a rare configuration: TrueNAS serves port 80 without
 * redirecting, and `localhost` counts as a secure context, so the modern API
 * works all through development and fails the moment the UI is opened by IP.
 *
 * So: use the real API wherever it exists — HTTPS, and localhost — and fall
 * back to `document.execCommand('copy')`, which predates secure-context gating
 * and still works without one. Verified against a v27 appliance over
 * `http://` (2026-09-21): the fallback returns true and the text genuinely
 * reaches the system clipboard.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /**
   * Resolves once the text is on the clipboard, and rejects if it is not.
   *
   * Never throws at the caller. A missing API surfaces as a *rejection*, which
   * is the half the old call sites silently lost: reading `.writeText` off an
   * undefined `navigator.clipboard` threw before any promise existed, so their
   * `.then(onSuccess, onError)` never ran.
   *
   * Deliberately not `async`. On the secure path this hands back the Clipboard
   * API's own promise, so it settles on exactly the tick it always did —
   * `async` would insert a microtask and move every caller's snackbar one tick
   * later, which is a behaviour change nobody asked for in the working case.
   */
  copy(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
      }

      this.copyViaDeprecatedExecCommand(text);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * The insecure-context path: put the text in an off-screen `<textarea>`,
   * select it, and let the browser copy the selection.
   *
   * `document.execCommand` is deprecated but implemented everywhere and has no
   * announced removal; it is the floor here, not the default. Kept synchronous
   * because it is — the promise comes from {@link copy} being `async`.
   */
  private copyViaDeprecatedExecCommand(text: string): void {
    const textArea = document.createElement('textarea');
    Object.assign(textArea.style, { position: 'fixed', left: '-9999px', top: '-9999px' });
    textArea.value = text;
    document.body.appendChild(textArea);

    // Where focus was, so a dialog with a focus trap does not end up with the
    // caret somewhere the user did not put it once the textarea is gone.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    try {
      textArea.select();
      // eslint-disable-next-line sonarjs/deprecation
      const isCopied = document.execCommand('copy');

      // `execCommand` reports a refused copy by returning false rather than
      // throwing, so without this the fallback would always claim success.
      if (!isCopied) {
        throw new Error('document.execCommand("copy") was refused');
      }
    } finally {
      textArea.remove();
      previouslyFocused?.focus?.();
    }
  }
}
