import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Subject, filter, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptext2fa } from 'app/helptext/system/2fa';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { globalTwoFactorCardElements } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.elements';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
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
    private chainedSlideIns: IxChainedSlideInService,
    private firstTimeWarning: FirstTimeWarningService,
  ) { }

  onConfigurePressed(twoFactorAuthConfig: GlobalTwoFactorConfig): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
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
