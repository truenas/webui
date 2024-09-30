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
            thisNodeInfo: info.this_node,
            otherNodeInfo: info.other_node,
          })),
        );
      }
      return this.ws.call('system.reboot.info').pipe(
        map((info) => rebootInfoLoaded({
          thisNodeInfo: info,
          otherNodeInfo: null,
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
            thisNodeInfo: event.fields?.this_node,
            otherNodeInfo: event.fields?.other_node,
          })),
        );
      }
      return this.ws.subscribe('system.reboot.info').pipe(
        map((event) => rebootInfoLoaded({
          thisNodeInfo: event.fields,
          otherNodeInfo: null,
        })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
  ) { }
}
