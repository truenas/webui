import { inject, Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import {
  catchError, from, Observable, of, switchMap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

/** How long after the app starts before the first lazy route is preloaded. */
export const preloadDelayMs = 10_000;

/** Longest a preload waits for the browser to be idle before it goes ahead anyway. */
export const preloadIdleTimeoutMs = 2_000;

/**
 * Preloads every lazy route, as `PreloadAllModules` does, but not at once and not right away.
 *
 * `PreloadAllModules` fetches and runs some 150 chunks as soon as the first navigation ends,
 * which is while the app is still signing in and drawing its first page, so both wait on it.
 * Here preloading starts `preloadDelayMs` after the app does, and each route then starts loading
 * in an idle period of its own, one after the other, so the chunks never land on the page all
 * at once. Someone typing a password on the sign-in form still has everything preloaded by the
 * time they are in. A route opened before its turn just loads on demand, as it would without
 * preloading.
 *
 * Only the starts are spaced out, never the loads themselves: a route's load includes preloading
 * its children, which queue behind it, so waiting for it to finish would wait forever.
 */
@Injectable({ providedIn: 'root' })
export class IdlePreloadingStrategy implements PreloadingStrategy {
  private window = inject<Window>(WINDOW);

  private lastTurn = new Promise<void>((resolve) => {
    this.window.setTimeout(resolve, preloadDelayMs);
  });

  preload(_: Route, load: () => Observable<unknown>): Observable<unknown> {
    const turn = this.lastTurn.then(() => this.whenIdle());
    this.lastTurn = turn;
    return from(turn).pipe(
      switchMap(() => load()),
      // As PreloadAllModules does: a route that fails to preload loads again when opened.
      catchError(() => of(null)),
    );
  }

  private whenIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof this.window.requestIdleCallback === 'function') {
        this.window.requestIdleCallback(() => resolve(), { timeout: preloadIdleTimeoutMs });
      } else {
        this.window.setTimeout(resolve);
      }
    });
  }
}
