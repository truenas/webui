import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject, filter, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { globalTwoFactorCardElements } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.elements';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-two-factor-card',
  templateUrl: './global-two-factor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    MatTooltip,
    TranslateModule,
  ],
})
export class GlobalTwoFactorAuthCardComponent {
  readonly helpText = helptext2fa;
  protected readonly searchableElements = globalTwoFactorCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

  private readonly reloadConfig$ = new Subject<void>();
  readonly twoFactorConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('auth.twofactor.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    private chainedSlideIns: ChainedSlideInService,
  ) { }

  onConfigurePressed(twoFactorAuthConfig: GlobalTwoFactorConfig): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(
        GlobalTwoFactorAuthFormComponent,
        false,
        twoFactorAuthConfig,
      )),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
