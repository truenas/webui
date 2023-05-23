import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
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
  taskLimit$: Observable<LoadingState<number>>;

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  async onConfigurePressed(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideIn = this.slideInService.open(ReplicationSettingsFormComponent);
    this.taskLimit$ = slideIn.slideInClosed$.pipe(
      startWith(undefined),
      switchMap(() => this.ws.call('replication.config.config')),
      map((config) => config.max_parallel_replication_tasks),
      toLoadingState(),
    );
  }
}
