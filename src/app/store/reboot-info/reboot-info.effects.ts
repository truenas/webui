import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  map, mergeMap, switchMap, take,
} from 'rxjs/operators';
import { ApiService } from 'app/modules/websocket/api.service';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { rebootInfoLoaded, refreshRebootInfo } from 'app/store/reboot-info/reboot-info.actions';

@Injectable()
export class RebootInfoEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private store$ = inject(Store);

  loadRebootInfo = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    mergeMap(({ isHaLicensed }) => this.fetchRebootInfo(isHaLicensed)),
  ));

  refreshRebootInfo = createEffect(() => this.actions$.pipe(
    ofType(refreshRebootInfo),
    switchMap(() => this.store$.select(selectIsHaLicensed).pipe(take(1))),
    mergeMap((isHaLicensed) => this.fetchRebootInfo(isHaLicensed)),
  ));

  subscribeToRebootInfo = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    mergeMap(({ isHaLicensed }) => {
      if (isHaLicensed) {
        return this.api.subscribe('failover.reboot.info').pipe(
          map((event) => rebootInfoLoaded({
            thisNodeRebootInfo: event.fields?.this_node,
            otherNodeRebootInfo: event.fields?.other_node,
          })),
        );
      }
      return this.api.subscribe('system.reboot.info').pipe(
        map((event) => rebootInfoLoaded({
          thisNodeRebootInfo: event.fields,
          otherNodeRebootInfo: null,
        })),
      );
    }),
  ));

  private fetchRebootInfo(isHaLicensed: boolean): Observable<ReturnType<typeof rebootInfoLoaded>> {
    if (isHaLicensed) {
      return this.api.call('failover.reboot.info').pipe(
        map((info) => rebootInfoLoaded({
          thisNodeRebootInfo: info.this_node,
          otherNodeRebootInfo: info.other_node,
        })),
      );
    }
    return this.api.call('system.reboot.info').pipe(
      map((info) => rebootInfoLoaded({
        thisNodeRebootInfo: info,
        otherNodeRebootInfo: null,
      })),
    );
  }
}
