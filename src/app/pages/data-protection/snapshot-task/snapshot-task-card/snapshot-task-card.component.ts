import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { snapshotTaskCardElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.elements';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-task-card',
  templateUrl: './snapshot-task-card.component.html',
  styleUrls: ['./snapshot-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    MatAnchor,
    UiSearchDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SnapshotTaskCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly uiSearchableElement = snapshotTaskCardElements;

  dataProvider: AsyncDataProvider<PeriodicSnapshotTaskUi>;

  columns = createTable<PeriodicSnapshotTaskUi>([
    textColumn({
      title: this.translate.instant('Pool/Dataset'),
      propertyName: 'dataset',
    }),
    textColumn({
      propertyName: 'lifetime_unit',
      title: this.translate.instant('Keep for'),
      getValue: (row) => `${row.lifetime_value} ${row.lifetime_unit}(S)`.toLowerCase(),
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
      getValue: (row) => this.taskService.getTaskCronDescription(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
        : this.translate.instant('Disabled')),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.state?.datetime?.$date,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      requiredRoles: this.requiredRoles,
      onRowToggle: (row: PeriodicSnapshotTaskUi) => this.onChangeEnabledState(row),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      cssClass: 'state-button',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'snapshot-task-' + row.dataset + '-' + row.state.state,
    ariaLabels: (row) => [row.dataset, this.translate.instant('Snapshot Task')],
  });

  constructor(
    private slideInService: SlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private taskService: TaskService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const snapshotTasks$ = this.ws.call('pool.snapshottask.query').pipe(
      map((snapshotTasks) => snapshotTasks as PeriodicSnapshotTaskUi[]),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(snapshotTasks$);
    this.getSnapshotTasks();
  }

  getSnapshotTasks(): void {
    this.dataProvider.load();
  }

  doDelete(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${snapshotTask.dataset} - ${snapshotTask.naming_schema}`,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.snapshottask.delete', [snapshotTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  openForm(row?: PeriodicSnapshotTaskUi): void {
    const slideInRef = this.slideInService.open(SnapshotTaskFormComponent, { data: row, wide: true });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getSnapshotTasks();
    });
  }

  private onChangeEnabledState(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.ws
      .call('pool.snapshottask.update', [snapshotTask.id, { enabled: !snapshotTask.enabled } as PeriodicSnapshotTaskUi])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getSnapshotTasks();
        },
        error: (err: unknown) => {
          this.getSnapshotTasks();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }
}
