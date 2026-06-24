import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { Subject } from 'rxjs';
import {
  map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { replicationSettingsCardElements } from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.elements';
import { getReplicationSettingsFormConfig } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-replication-settings-card',
  styleUrls: ['./replication-settings-card.component.scss'],
  templateUrl: './replication-settings-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class ReplicationSettingsCardComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

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

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(
        getReplicationSettingsFormConfig(this.api, this.translate),
        { title: this.translate.instant('Replication'), editData: this.replicationConfig },
      ).success$),
      tap(() => this.reloadConfig$.next()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
