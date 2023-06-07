import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, share } from 'rxjs';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-global-two-factor-auth-card',
  templateUrl: './global-two-factor-auth-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthCardComponent {
  readonly twoFactorAuthConfig$: Observable<LoadingState<TwoFactorConfig>> = this.ws.call('auth.twofactor.config').pipe(
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
    this.slideInService.open(KernelFormComponent, { data: twoFactorAuthConfig });
  }
}
