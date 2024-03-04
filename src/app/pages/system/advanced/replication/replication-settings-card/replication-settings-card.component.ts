import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import {
  filter,
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-settings-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './replication-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationSettingsCardComponent {
  private replicationConfig: ReplicationConfig;
  private readonly reloadConfig$ = new Subject<void>();
  taskLimit$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('replication.config.config')),
    tap((config) => this.replicationConfig = config),
    map((config) => config.max_parallel_replication_tasks),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private ws: WebSocketService,
    private chainedSlideIns: IxChainedSlideInService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(
        ReplicationSettingsFormComponent,
        false,
        this.replicationConfig,
      )),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
