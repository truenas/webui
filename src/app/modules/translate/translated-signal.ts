import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

/**
 * A `computed` that re-runs whenever the active language changes.
 *
 * `TranslateService.instant()` reads the *current* translations and nothing more, so a value
 * derived from it in a field initializer or a plain `computed` keeps the language it was first
 * evaluated in. The `translate` pipe handles this on its own (it is impure and subscribes to
 * `onLangChange`), so **prefer the pipe** whenever the string goes straight into a template.
 * Reach for this only when the value has to be composed in TypeScript — several keys folded into
 * one string, an object of labels handed to a library token, an `instant()` used as an
 * interpolation parameter.
 *
 * Must be called in an injection context (a field initializer, a constructor, or a DI factory),
 * like the `toSignal` it wraps.
 *
 * @example
 * ```ts
 * protected readonly ariaLabel = translatedSignal((translate) => translate.instant('{a}. {b}', {
 *   a: translate.instant(this.labelKey),
 *   b: translate.instant(this.hintKey),
 * }));
 * ```
 */
export function translatedSignal<T>(compute: (translate: TranslateService) => T): Signal<T> {
  const translate = inject(TranslateService);
  const langChange = toSignal(translate.onLangChange, { initialValue: null });

  return computed(() => {
    // Read the lang-change signal so the computed re-runs after each language switch.
    langChange();
    return compute(translate);
  });
}
