import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { Observable, filter, map, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import {
  TableToggleCellComponent,
} from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { snapshotTaskCardElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.elements';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SnapshotTaskService } from 'app/services/snapshot-task.service';

@Component({
  selector: 'ix-snapshot-task-card',
  templateUrl: './snapshot-task-card.component.html',
  styleUrls: ['./snapshot-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnTestIdDirective,
    RouterLink,
    TnIconComponent,
    TnTooltipDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    TableToggleCellComponent,
    TableActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class SnapshotTaskCardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private loader = inject(LoaderService);
  protected emptyService = inject(EmptyService);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly uiSearchableElement = snapshotTaskCardElements;
  protected readonly cardMenuPath = ['data-protection', 'snapshot'];

  dataProvider: AsyncDataProvider<PeriodicSnapshotTaskUi>;

  protected readonly displayedColumns = ['dataset', 'state', 'enabled', 'actions'];

  protected readonly actions: IconActionConfig<PeriodicSnapshotTaskUi>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.openForm(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected readonly trackByTaskId = (_index: number, row: PeriodicSnapshotTaskUi): number => row.id;

  protected uniqueRowTag(row: PeriodicSnapshotTaskUi): string {
    // Key on the dataset only — `state.state` is mutable, so including it would
    // change the generated data-test id whenever the task's state changes and
    // break e2e selectors that target the row.
    return convertStringToId('snapshot-task-' + row.dataset);
  }

  protected ariaLabel(row: PeriodicSnapshotTaskUi): string {
    return [row.dataset, this.translate.instant('Snapshot Task')].join(' ');
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<PeriodicSnapshotTaskUi>(event, this.displayedColumns));
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'dataset',
    });
  }

  ngOnInit(): void {
    const snapshotTasks$ = this.api.call('pool.snapshottask.query').pipe(
      map((snapshotTasks) => snapshotTasks as PeriodicSnapshotTaskUi[]),
    );
    this.dataProvider = new AsyncDataProvider<PeriodicSnapshotTaskUi>(snapshotTasks$);
    this.setDefaultSort();
    this.getSnapshotTasks();

    this.api.subscribe('pool.snapshottask.query').pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.getSnapshotTasks();
      },
    });
  }

  private getSnapshotTasks(): void {
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
    return this.api.call('pool.snapshottask.delete', [taskId, { fixate_removal_date: fixateRemovalDate }]).pipe(this.loader.withLoader());
  }

  // SnapshotTaskFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly snapshotTaskForm = SnapshotTaskFormComponent as unknown as Type<SidePanelForm>;

  protected openForm(row?: PeriodicSnapshotTaskUi): void {
    this.formPanel.open(this.snapshotTaskForm, {
      title: row
        ? this.translate.instant('Edit Periodic Snapshot Task')
        : this.translate.instant('Add Periodic Snapshot Task'),
      wide: true,
      inputs: { taskToEdit: row },
    }).onSuccess(() => this.getSnapshotTasks(), this.destroyRef);
  }

  protected onChangeEnabledState(snapshotTask: PeriodicSnapshotTaskUi, toggle: TableToggleCellComponent): void {
    this.api
      .call('pool.snapshottask.update', [snapshotTask.id, { enabled: !snapshotTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getSnapshotTasks();
        },
        error: (error: unknown) => {
          toggle.revert();
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
