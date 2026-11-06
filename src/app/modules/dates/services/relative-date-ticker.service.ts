import { Injectable } from '@angular/core';
import {
  interval, Observable, shareReplay, startWith,
} from 'rxjs';

/** How often a rendered "time ago" label is re-derived. */
export const relativeDateTickInterval = 30_000;

@Injectable({ providedIn: 'root' })
export class RelativeDateTickerService {
  /**
   * Ticks on a coarse interval so a `computed` rendering a relative date ("1 min. ago") from a fixed
   * timestamp can depend on *now*; the value means nothing. Shared and ref-counted: one timer for the
   * app, none while nothing renders a relative date. The signal write derived from it, not the tick,
   * marks OnPush subscribers for refresh.
   */
  readonly tick$: Observable<number> = interval(relativeDateTickInterval).pipe(
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
