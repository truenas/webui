import { computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';

/**
 * A `computed` that re-runs whenever translations change.
 *
 * `TranslateService.instant()` reads the *current* translations and nothing more, so a value
 * derived from it in a field initializer or a plain `computed` keeps whatever was loaded when it
 * was first evaluated — including the raw key, if the bundle had not been merged yet. The
 * `translate` pipe handles this on its own (it is impure and subscribes to all three change
 * streams), so **prefer the pipe** whenever the string goes straight into a template.
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
  // The same three streams the `translate` pipe subscribes to: a language switch, a bundle merged
  // after the fact (lazy load, `use()` re-fetch), and a default-language change.
  const retranslate = toSignal(
    merge(translate.onLangChange, translate.onTranslationChange, translate.onDefaultLangChange),
    { initialValue: null },
  );

  return computed(() => {
    // Read the signal so the computed re-runs on each of them.
    retranslate();
    return compute(translate);
  });
}
