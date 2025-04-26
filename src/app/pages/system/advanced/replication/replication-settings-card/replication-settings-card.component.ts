import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import {
  filter,
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { replicationSettingsCardElements } from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.elements';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-settings-card',
  styleUrls: ['../../../general-settings/common-settings-card.scss'],
  templateUrl: './replication-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class ReplicationSettingsCardComponent {
  protected readonly requiredRoles = [Role.ReplicationTaskConfigWrite];
  private replicationConfig: ReplicationConfig;
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = replicationSettingsCardElements;
  taskLimit$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('replication.config.config')),
    tap((config) => this.replicationConfig = config),
    map((config) => config.max_parallel_replication_tasks),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private api: ApiService,
    private slideIn: SlideIn,
    private firstTimeWarning: FirstTimeWarningService,
  ) {}

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(
        ReplicationSettingsFormComponent,
        { data: this.replicationConfig },
      )),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
