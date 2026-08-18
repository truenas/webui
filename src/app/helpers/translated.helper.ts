import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';

/**
 * A signal that changes identity whenever the resolved translation of a key could change.
 *
 * `TranslateService.instant()` resolves against the catalog loaded *at the moment it is called*,
 * so a `computed` (or any other cache) that calls it freezes on that snapshot — unlike the
 * `| translate` pipe. Reading this signal inside such a derivation re-establishes that dependency.
 *
 * Mirrors the three streams the pipe itself subscribes to, not just `onLangChange`: a catalog
 * arriving late (`onTranslationChange`) or the fallback language changing
 * (`onDefaultLangChange`) also changes what `instant()` returns. Without them, an `instant()` that
 * ran before the active language's catalog finished loading would return the key and stay cached
 * on it until the user switched language.
 *
 * Must be called from an injection context (e.g. a component field initializer).
 */
export function langChangeSignal(): Signal<unknown> {
  const translate = inject(TranslateService);

  return toSignal(
    merge(translate.onLangChange, translate.onTranslationChange, translate.onDefaultLangChange),
    { initialValue: null },
  );
}

/**
 * A `computed` that also re-runs whenever translations change, for derivations that call
 * `TranslateService.instant()` instead of going through the `| translate` pipe.
 *
 * The pipe handles this on its own (it is impure and subscribes to all three change streams), so
 * **prefer the pipe** whenever the string goes straight into a template. Reach for this only when
 * the value has to be composed in TypeScript — several keys folded into one string, an object of
 * labels handed to a library token, an `instant()` used as an interpolation parameter.
 *
 * Lazy like any `computed`: nothing is translated until the signal is read.
 *
 * Must be called from an injection context (a field initializer, a constructor, or a DI factory),
 * like the `toSignal` it wraps.
 *
 * @param derive Receives the `TranslateService`, so a DI factory or a helper with no `translate`
 * field of its own does not have to inject one; a component that already has one can ignore it.
 *
 * @example
 * protected readonly stateText = translated(() => this.translate.instant(this.state()));
 *
 * @example
 * ```ts
 * protected readonly ariaLabel = translated((translate) => translate.instant('{a}. {b}', {
 *   a: translate.instant(this.labelKey),
 *   b: translate.instant(this.hintKey),
 * }));
 * ```
 */
export function translated<T>(derive: (translate: TranslateService) => T): Signal<T> {
  const translate = inject(TranslateService);
  const lang = langChangeSignal();

  return computed(() => {
    lang();
    return derive(translate);
  });
}
