import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import {
  filter, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { failoverAllowedReasons } from 'app/enums/failover-disabled-reason.enum';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { AuthService } from 'app/services/auth/auth.service';
import { FipsService } from 'app/services/fips.service';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { rebootInfoLoaded } from 'app/store/reboot-info/reboot-info.actions';

@UntilDestroy()
@Injectable()
export class HaFipsEffects {
  checkIfRebootRequired$ = createEffect(() => this.actions$.pipe(
    ofType(rebootInfoLoaded),
    withLatestFrom(this.store$.select(selectIsHaLicensed)),
    filter(([, isHa]) => isHa),
    withLatestFrom(this.store$.select(selectHaStatus)),
    filter(([, haStatus]) => haStatus?.reasons?.every((reason) => failoverAllowedReasons.includes(reason))),
    filterAsync(() => this.authService.hasRole([Role.FullAdmin])),
    switchMap(([[{ thisNodeInfo, otherNodeInfo }]]) => {
      const needsToReloadSelf = thisNodeInfo.reboot_required_reasons?.length;

      if (needsToReloadSelf) {
        return this.fips.promptForFailover();
      }

      const needsToReloadRemote = otherNodeInfo.reboot_required_reasons?.length;
      if (needsToReloadRemote) {
        return this.fips.promptForRemoteRestart();
      }

      return EMPTY;
    }),
  ), { dispatch: false });

  constructor(
    private fips: FipsService,
    private actions$: Actions,
    private store$: Store,
    private authService: AuthService,
  ) {}
}
