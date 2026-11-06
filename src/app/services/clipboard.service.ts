import { Clipboard } from '@angular/cdk/clipboard';
import { inject, Injectable } from '@angular/core';

/**
 * Copies text to the clipboard, including over plain HTTP. `navigator.clipboard` is `undefined` outside a
 * secure context, and reading `.writeText` off it throws before any promise exists, so callers' error
 * handlers never run. That's common: TrueNAS serves port 80 without redirecting, while `localhost`
 * counts as secure in development. The fallback is the CDK `Clipboard`, built on `execCommand('copy')`.
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
   * Resolves once the text is copied and rejects otherwise, never throwing synchronously. Not `async`,
   * so the secure path settles on the same tick as the Clipboard API's own promise. The fallback runs
   * only when the API is absent: a rejected write means no focus or no permission, which `execCommand`
   * would hit too, turning a reported failure into a silent one.
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
