import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, mergeMap } from 'rxjs/operators';
import { WebSocketService } from 'app/services/ws.service';
import { failoverLicensedStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';

@Injectable()
export class RebootInfoEffects {
  loadRebootInfo = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    mergeMap(({ isHaLicensed }) => {
      if (isHaLicensed) {
        return this.ws.call('failover.reboot.info').pipe(
          map((info) => rebootInfoLoaded({
            thisNodeRebootInfo: info.this_node,
            otherNodeRebootInfo: info.other_node,
          })),
        );
      }
      return this.ws.call('system.reboot.info').pipe(
        map((info) => rebootInfoLoaded({
          thisNodeRebootInfo: info,
          otherNodeRebootInfo: null,
        })),
      );
    }),
  ));

  subscribeToRebootInfo = createEffect(() => this.actions$.pipe(
    ofType(failoverLicensedStatusLoaded),
    mergeMap(({ isHaLicensed }) => {
      if (isHaLicensed) {
        return this.ws.subscribe('failover.reboot.info').pipe(
          map((event) => rebootInfoLoaded({
            thisNodeRebootInfo: event.fields?.this_node,
            otherNodeRebootInfo: event.fields?.other_node,
          })),
        );
      }
      return this.ws.subscribe('system.reboot.info').pipe(
        map((event) => rebootInfoLoaded({
          thisNodeRebootInfo: event.fields,
          otherNodeRebootInfo: null,
        })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
  ) { }
}
