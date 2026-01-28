import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, filter, map, switchMap } from 'rxjs';
import { snapshotTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { snapshotTaskCardElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.elements';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SnapshotTaskService } from 'app/services/snapshot-task.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-snapshot-task-card',
  templateUrl: './snapshot-task-card.component.html',
  styleUrls: ['./snapshot-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    MatTooltip,
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
    EmptyComponent,
    CardAlertBadgeComponent,
  ],
})
export class SnapshotTaskCardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private taskService = inject(TaskService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private loader = inject(LoaderService);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly uiSearchableElement = snapshotTaskCardElements;
  protected readonly emptyConfig = snapshotTaskEmptyConfig;
  protected readonly cardMenuPath = ['data-protection', 'snapshot'];

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
    scheduleColumn({
      title: this.translate.instant('Frequency'),
      getValue: (row) => row.schedule,
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
    actionsWithMenuColumn({
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

  ngOnInit(): void {
    const snapshotTasks$ = this.api.call('pool.snapshottask.query').pipe(
      map((snapshotTasks) => snapshotTasks as PeriodicSnapshotTaskUi[]),
    );
    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(snapshotTasks$);
    this.getSnapshotTasks();

    this.api.subscribe('pool.snapshottask.query').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
    });
  }

  protected getSnapshotTasks(): void {
    this.dataProvider.load();
  }

  protected doDelete(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.snapshotTaskService.checkTaskHasSnapshots(snapshotTask.id).pipe(
      this.loader.withLoader(),
      switchMap((hasSnapshots) => this.confirmDelete(snapshotTask, hasSnapshots)),
      filter((result) => result.confirmed),
      switchMap((result) => this.deleteTask(snapshotTask.id, result.secondaryCheckbox)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private confirmDelete(
    task: PeriodicSnapshotTaskUi,
    hasSnapshots: boolean,
  ): Observable<DialogWithSecondaryCheckboxResult> {
    const confirmOptions: ConfirmOptionsWithSecondaryCheckbox = {
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Periodic Snapshot Task <b>"{value}"</b>?', {
        value: `${task.dataset} - ${task.naming_schema}`,
      }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
      secondaryCheckbox: hasSnapshots,
      secondaryCheckboxText: this.translate.instant(helptextSnapshotForm.keepSnapshotsLabel),
    };

    // TypeScript can't discriminate overloads when using extends, explicit cast needed
    return this.dialogService.confirm(confirmOptions) as unknown as Observable<DialogWithSecondaryCheckboxResult>;
  }

  private deleteTask(taskId: number, fixateRemovalDate: boolean): Observable<boolean> {
    return this.api.call('pool.snapshottask.delete', [taskId, fixateRemovalDate]);
  }

  protected openForm(row?: PeriodicSnapshotTaskUi): void {
    this.slideIn.open(SnapshotTaskFormComponent, { data: row, wide: true }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected onChangeEnabledState(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.api
      .call('pool.snapshottask.update', [snapshotTask.id, { enabled: !snapshotTask.enabled } as PeriodicSnapshotTaskUi])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
