import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, Subject, shareReplay,
} from 'rxjs';
import { toLoadingState, LoadingState } from 'app/helpers/to-loading-state.helper';
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
export class GlobalTwoFactorAuthCardComponent implements OnInit {
  protected twoFactorConfig$: Observable<LoadingState<TwoFactorConfig>>;

  constructor(
    private ws: WebSocketService,
    private advancedSettings: AdvancedSettingsService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.refreshCard();
  }

  refreshCard(): void {
    const twoFactorConfigUpdater$ = new Subject<TwoFactorConfig>();
    this.twoFactorConfig$ = twoFactorConfigUpdater$.pipe(
      toLoadingState(),
      shareReplay({
        refCount: false,
        bufferSize: 1,
      }),
    );
    this.cdr.markForCheck();
    this.ws.call('auth.twofactor.config').pipe(untilDestroyed(this)).subscribe((config) => {
      twoFactorConfigUpdater$.next(config);
      twoFactorConfigUpdater$.complete();
    });
  }

  async onConfigurePressed(twoFactorAuthConfig: TwoFactorConfig): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const ixSlideInRef = this.slideInService.open(GlobalTwoFactorAuthFormComponent, { data: twoFactorAuthConfig });
    ixSlideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe({
      next: (response: unknown) => {
        if (response === true) {
          this.refreshCard();
        }
      },
    });
  }
}
