import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, switchMap } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageCardComponent {
  systemDatasetPool$ = this.slideInService.onClose$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('systemdataset.config')),
    map((config) => config.pool),
    toLoadingState(),
  );

  readonly swapSize$ = this.store$.pipe(
    waitForAdvancedConfig,
    map((state) => state.swapondrive),
    toLoadingState(),
  );

  constructor(
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
    private store$: Store<AppState>,
    private ws: WebSocketService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideInService.open(StorageSettingsFormComponent);
  }
}
