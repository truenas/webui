import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { Subject, combineLatest } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SedUser } from 'app/enums/sed-user.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { sedCardElements } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.elements';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-self-encrypting-drive-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './self-encrypting-drive-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
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
    private chainedSlideIns: ChainedSlideInService,
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
