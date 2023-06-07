import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject, share, switchMap,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-auth-form/global-two-factor-auth-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-two-factor-auth-card',
  templateUrl: './global-two-factor-auth-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthCardComponent {
  private readonly refreshCard$ = new BehaviorSubject<void>(null);
  protected readonly twoFactorConfigUpdater$ = this.refreshCard$.pipe(
    switchMap(() => this.ws.call('auth.twofactor.config')),
    toLoadingState(),
    share(),
  );

  constructor(
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    private slideInService: IxSlideInService,
  ) { }

  async onConfigurePressed(twoFactorAuthConfig: TwoFactorConfig): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideInService.open(GlobalTwoFactorAuthFormComponent, { data: twoFactorAuthConfig });
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe({
      next: (response: unknown) => {
        if (response === true) {
          this.refreshCard$.next();
        }
      },
    });
  }
}
