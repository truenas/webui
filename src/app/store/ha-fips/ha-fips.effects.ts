import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EMPTY } from 'rxjs';
import {
  filter, switchMap, withLatestFrom,
} from 'rxjs/operators';
import { failoverAllowedReasons, FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { AuthService } from 'app/services/auth/auth.service';
import { FipsService } from 'app/services/fips.service';
import { haStatusLoaded } from 'app/store/ha-info/ha-info.actions';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Injectable()
export class HaFipsEffects {
  checkIfRebootRequired$ = createEffect(() => this.actions$.pipe(
    ofType(haStatusLoaded),
    withLatestFrom(this.store$.select(selectIsHaLicensed)),
    filter(([, isHa]) => isHa),
    filterAsync(() => this.authService.hasRole([Role.FullAdmin])),
    switchMap(([{ haStatus }]) => {
      // Indicative of a machine that hasn't finished booting.
      const hasOtherReasons = haStatus.reasons.some((reason) => !failoverAllowedReasons.includes(reason));

      if (hasOtherReasons) {
        return EMPTY;
      }

      const needsToReloadSelf = haStatus.reasons.includes(FailoverDisabledReason.LocalFipsRebootRequired);

      if (needsToReloadSelf) {
        return this.fips.promptForFailover();
      }

      const needsToReloadRemote = haStatus.reasons.includes(FailoverDisabledReason.RemoteFipsRebootRequired);
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
