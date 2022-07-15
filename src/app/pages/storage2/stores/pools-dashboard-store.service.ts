import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PoolsDashboardState {
}

@Injectable()
export class PoolsDashboardStore extends ComponentStore<PoolsDashboardState> {
  dashboardReloaded$ = new Subject<void>();

  // TODO: Not a full implementation.
  readonly loadDashboard = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.dashboardReloaded$.next();
      }),
    );
  });
}
