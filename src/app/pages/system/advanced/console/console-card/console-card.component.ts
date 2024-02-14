import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  Subject, filter, shareReplay, startWith, switchMap, take, tap,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy(this)
@Component({
  selector: 'ix-console-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './console-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  readonly advancedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$),
    waitForAdvancedConfig,
    take(1),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private store$: Store<AppState>,
    private chainedSlideIns: IxChainedSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(ConsoleFormComponent)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
