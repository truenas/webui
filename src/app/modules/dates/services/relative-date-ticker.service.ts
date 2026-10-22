import { Injectable } from '@angular/core';
import {
  interval, Observable, shareReplay, startWith,
} from 'rxjs';

/** How often a rendered "time ago" label is re-derived. */
export const relativeDateTickInterval = 30_000;

@Injectable({ providedIn: 'root' })
export class RelativeDateTickerService {
  /**
   * Emits on a coarse interval so anything rendering a relative date ("1 min. ago") can
   * take a dependency on the clock. The emitted number carries no meaning — it exists
   * only to invalidate a `computed` whose output depends on *now* while its inputs are a
   * fixed timestamp that never changes.
   *
   * Shared and ref-counted: one timer for the whole app, and none at all while nothing is
   * rendering a relative date. The tick alone never triggers change detection — the signal
   * write derived from it is what marks the (OnPush) subscribers for refresh.
   */
  readonly tick$: Observable<number> = interval(relativeDateTickInterval).pipe(
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
