import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, filter, shareReplay,
} from 'rxjs';
import { toLoadingState, LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { GlobalTwoFactorAuthFormComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-form/global-two-factor-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-two-factor-card',
  templateUrl: './global-two-factor-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalTwoFactorAuthCardComponent implements OnInit {
  protected twoFactorConfig$: Observable<LoadingState<GlobalTwoFactorConfig>>;

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
    this.twoFactorConfig$ = this.ws.call('auth.twofactor.config').pipe(
      toLoadingState(),
      shareReplay({
        refCount: false,
        bufferSize: 1,
      }),
    );
    this.cdr.markForCheck();
  }

  async onConfigurePressed(twoFactorAuthConfig: GlobalTwoFactorConfig): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const ixSlideInRef = this.slideInService.open(GlobalTwoFactorAuthFormComponent, { data: twoFactorAuthConfig });
    ixSlideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: (response: unknown) => {
        if (response === true) {
          this.refreshCard();
        }
      },
    });
  }
}
