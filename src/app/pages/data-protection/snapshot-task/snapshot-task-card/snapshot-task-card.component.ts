import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
  TnTooltipDirective,
  type TnCardAction,
  type TnSortEvent,
} from '@truenas/ui-components';
import { Observable, filter, map, switchMap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { PeriodicSnapshotTaskUi } from 'app/interfaces/periodic-snapshot-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { convertStringToId, mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { snapshotTaskCardElements } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.elements';
import { SnapshotTaskFormComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-form/snapshot-task-form.component';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import {
  ShareToggleCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-toggle-cell/share-toggle-cell.component';
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
    TestDirective,
    RouterLink,
    TnIconComponent,
    TnTooltipDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    IxTablePagerShowMoreComponent,
    UiSearchDirective,
    TranslateModule,
    AsyncPipe,
    TnEmptyComponent,
    CardAlertBadgeComponent,
    ShareToggleCellComponent,
    ShareActionsCellComponent,
    TaskStateCellComponent,
  ],
})
export class SnapshotTaskCardComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private loader = inject(LoaderService);
  protected emptyService = inject(EmptyService);
  private authService = inject(AuthService);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly uiSearchableElement = snapshotTaskCardElements;
  protected readonly cardMenuPath = ['data-protection', 'snapshot'];

  private hasAddRole = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });

  protected addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAddRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'button-snapshot-task-add',
      handler: () => this.openForm(),
    };
  });

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
    return convertStringToId('snapshot-task-' + row.dataset + '-' + row.state.state);
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
    return this.api.call('pool.snapshottask.delete', [taskId, { fixate_removal_date: fixateRemovalDate }]).pipe(this.loader.withLoader());
  }

  protected openForm(row?: PeriodicSnapshotTaskUi): void {
    this.slideIn.open(SnapshotTaskFormComponent, { data: row, wide: true })
      .onSuccess(() => this.getSnapshotTasks(), this.destroyRef);
  }

  protected onChangeEnabledState(snapshotTask: PeriodicSnapshotTaskUi): void {
    this.api
      .call('pool.snapshottask.update', [snapshotTask.id, { enabled: !snapshotTask.enabled }])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
