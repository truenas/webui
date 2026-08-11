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
 * A `computed` that also re-runs on a language change, for derivations that call
 * `TranslateService.instant()` instead of going through the `| translate` pipe.
 *
 * Must be called from an injection context (e.g. a component field initializer).
 *
 * @example
 * protected readonly stateText = translated(() => this.translate.instant(this.state()));
 */
export function translated<T>(derive: () => T): Signal<T> {
  const lang = langChangeSignal();

  return computed(() => {
    lang();
    return derive();
  });
}
