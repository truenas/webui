import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Subject, filter, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-two-factor-card',
  templateUrl: './global-two-factor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthCardComponent {
  readonly helpText = helptext2fa;

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
    private chainedSlideIns: IxChainedSlideInService,
  ) { }

  onConfigurePressed(twoFactorAuthConfig: GlobalTwoFactorConfig): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(
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
