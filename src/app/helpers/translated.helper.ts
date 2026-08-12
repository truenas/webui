import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

/**
 * A signal that changes identity whenever the active language changes.
 *
 * `TranslateService.instant()` resolves against the language loaded *at the
 * moment it is called*, so a `computed` (or any other cache) that calls it
 * freezes on the first locale — unlike the `| translate` pipe, which re-runs on
 * `onLangChange`. Reading this signal inside such a derivation re-establishes
 * that dependency.
 *
 * Must be called from an injection context (e.g. a component field initializer).
 */
export function langChangeSignal(): Signal<unknown> {
  return toSignal(inject(TranslateService).onLangChange, { initialValue: null });
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
