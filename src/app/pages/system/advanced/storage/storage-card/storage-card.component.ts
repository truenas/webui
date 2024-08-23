import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  Subject, map, switchMap,
} from 'rxjs';
import {
  filter, shareReplay, startWith, tap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { storageCardElements } from 'app/pages/system/advanced/storage/storage-card/storage-card.elements';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppsState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  private storageSettings: { systemDsPool: string };
  protected readonly searchableElements = storageCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

  readonly storageSettings$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('systemdataset.config').pipe(map((config) => config.pool))),
    map((systemDsPool) => ({ systemDsPool })),
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
    private store$: Store<AppsState>,
    private ws: WebSocketService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(StorageSettingsFormComponent, false, this.storageSettings)),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
