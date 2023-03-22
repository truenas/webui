import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-storage-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './storage-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageCardComponent {
  systemDatasetPool$ = this.ws.call('systemdataset.config').pipe(
    map((config) => config.pool),
    toLoadingState(),
  );

  constructor(
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
    private ws: WebSocketService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(StorageSettingsFormComponent);
  }
}
