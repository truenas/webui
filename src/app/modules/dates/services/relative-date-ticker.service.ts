import { inject, Injectable, NgZone } from '@angular/core';
import {
  interval, Observable, shareReplay, startWith,
} from 'rxjs';

/** How often a rendered "time ago" label is re-derived. */
export const relativeDateTickInterval = 30_000;

@Injectable({ providedIn: 'root' })
export class RelativeDateTickerService {
  private zone = inject(NgZone);

  /**
   * Emits on a coarse interval so anything rendering a relative date ("1 min. ago") can
   * take a dependency on the clock. The emitted number carries no meaning — it exists
   * only to invalidate a `computed` whose output depends on *now* while its inputs are a
   * fixed timestamp that never changes.
   *
   * Shared and ref-counted: one timer for the whole app, and none at all while nothing is
   * rendering a relative date. It runs outside the Angular zone so the tick alone doesn't
   * trigger an application-wide change detection pass — the signal write derived from it
   * is what marks the (OnPush) subscribers for refresh.
   */
  readonly tick$: Observable<number> = new Observable<number>(
    // Subscribe (not just construct) outside the zone: `interval` registers its timer when
    // it is subscribed to, and a timer inside the zone would keep the app from ever
    // reaching stability — which also hangs every harness-driven test on the page.
    (subscriber) => this.zone.runOutsideAngular(
      () => interval(relativeDateTickInterval).subscribe(subscriber),
    ),
  ).pipe(
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
