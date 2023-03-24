import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map, startWith, switchMap } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@Component({
  selector: 'ix-replication-settings-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './replication-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationSettingsCardComponent {
  taskLimit$ = this.slideIn.onClose$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('replication.config.config')),
    map((config) => config.max_parallel_replication_tasks),
    toLoadingState(),
  );

  constructor(
    private ws: WebSocketService,
    private slideIn: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    this.slideIn.open(ReplicationSettingsFormComponent);
  }
}
