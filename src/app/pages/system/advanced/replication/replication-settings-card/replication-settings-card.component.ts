import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import {
  filter,
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { replicationSettingsCardElements } from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.elements';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
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
  protected readonly requiredRoles = [Role.ReplicationTaskConfigWrite];
  private replicationConfig: ReplicationConfig;
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = replicationSettingsCardElements;
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
    private firstTimeWarning: FirstTimeWarningService,
  ) {}

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(
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
