import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Injectable } from '@angular/core';

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
 * So: prefer the real API, and fall back to the CDK's `Clipboard`, which is
 * built on `document.execCommand('copy')` — deprecated, but it predates
 * secure-context gating and still works without one.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  /**
   * The insecure-context path, and the repo's existing answer to copying text:
   * four components already inject this directly. It owns the off-screen
   * textarea, the selection, the `execCommand` call, restoring focus to
   * whatever had it, and removing the textarea afterwards — so none of that is
   * reimplemented here.
   */
  private fallback = inject(Clipboard);

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
   *
   * The fallback is reached only when the API is *absent*, not when a write
   * rejects. A rejection in a secure context means the document was not
   * focused or the permission was refused, and `execCommand` is subject to the
   * same conditions — retrying through it would mostly convert a reported
   * failure into a silent one.
   */
  copy(text: string): Promise<void> {
    try {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(text);
      }

      // Reports a refused copy by returning false rather than throwing, so
      // without this the fallback would always claim success. The CDK catches
      // whatever `execCommand` throws and folds it into that same `false`, so
      // a refusal and a thrown copy are indistinguishable from here — callers
      // render one generic message either way.
      return this.fallback.copy(text)
        ? Promise.resolve()
        : Promise.reject(new Error('Copying to the clipboard was refused'));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
