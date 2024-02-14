import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import {
  distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy(this)
@Component({
  selector: 'ix-kernel-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './kernel-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  readonly debugKernel$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$.pipe(waitForAdvancedConfig)),
    distinctUntilChanged((previous, current) => {
      return previous.debugkernel === current.debugkernel;
    }),
    map((config) => config.debugkernel),
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

  onConfigurePressed(debugKernel: boolean): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(KernelFormComponent, false, debugKernel)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
