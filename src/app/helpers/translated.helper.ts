import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';

/**
 * A signal that changes whenever a key's translation could, so a `computed` calling `instant()`
 * doesn't freeze on the catalog loaded when it ran. It mirrors all three streams the pipe watches:
 * without `onTranslationChange` and `onDefaultLangChange`, an `instant()` that ran before the catalog
 * loaded would stay cached on the bare key. Call from an injection context.
 */
export function langChangeSignal(): Signal<unknown> {
  const translate = inject(TranslateService);

  return toSignal(
    merge(translate.onLangChange, translate.onTranslationChange, translate.onDefaultLangChange),
    { initialValue: null },
  );
}

/**
 * A `computed` that also re-runs when translations change, for values built with `instant()` in
 * TypeScript, e.g. `translated((translate) => translate.instant('{a}. {b}', {...}))`. Prefer the
 * `| translate` pipe for strings going straight into a template. `derive` gets the
 * `TranslateService`, so callers without one needn't inject it. Call from an injection context.
 */
export function translated<T>(derive: (translate: TranslateService) => T): Signal<T> {
  const translate = inject(TranslateService);
  const lang = langChangeSignal();

  return computed(() => {
    lang();
    return derive(translate);
  });
}
