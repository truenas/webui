import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  Subject, combineLatest, map, switchMap,
} from 'rxjs';
import {
  distinctUntilChanged, filter, shareReplay, startWith, tap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  private storageSettings: { systemDsPool: string; swapSize: number };

  readonly storageSettings$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => {
      const pool$ = this.ws.call('systemdataset.config').pipe(
        map((config) => config.pool),
      );
      const swapSize$ = this.store$.pipe(
        waitForAdvancedConfig,
        distinctUntilChanged((previous, current) => previous.swapondrive === current.swapondrive),
        map((state) => state.swapondrive),
      );
      return combineLatest([
        pool$,
        swapSize$,
      ]);
    }),
    map(([systemDsPool, swapSize]) => ({ systemDsPool, swapSize })),
    tap((config) => this.storageSettings = config),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private chainedSlideIns: IxChainedSlideInService,
    private advancedSettings: AdvancedSettingsService,
    private store$: Store<AppState>,
    private ws: WebSocketService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(StorageSettingsFormComponent, false, this.storageSettings)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
