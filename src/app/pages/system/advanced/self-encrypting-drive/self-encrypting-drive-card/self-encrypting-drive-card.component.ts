import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { isEqual } from 'lodash-es';
import { Subject, combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { SedUser } from 'app/enums/sed-user.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { sedCardElements } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.elements';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-self-encrypting-drive-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './self-encrypting-drive-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfEncryptingDriveCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = sedCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

  private sedConfig: { sedUser: SedUser; sedPassword: string };
  readonly sedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => {
      const updatedSedUser$ = this.store$.pipe(
        waitForAdvancedConfig,
        distinctUntilChanged((previous, current) => isEqual(previous.sed_user, current.sed_user)),
        map((config) => config.sed_user),
      );
      const updatedSedPassword$ = this.ws.call('system.advanced.sed_global_password').pipe(
        map((sedPassword) => '*'.repeat(sedPassword.length) || '–'),
      );
      return combineLatest([
        updatedSedUser$,
        updatedSedPassword$,
      ]);
    }),
    map(([sedUser, sedPassword]) => ({ sedUser, sedPassword })),
    tap((config) => this.sedConfig = config),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private store$: Store<AppState>,
    private ws: WebSocketService,
    private chainedSlideIns: IxChainedSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  onConfigure(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(SelfEncryptingDriveFormComponent, false, this.sedConfig)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
