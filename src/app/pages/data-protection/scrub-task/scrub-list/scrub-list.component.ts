import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { scrubListElements } from 'app/pages/data-protection/scrub-task/scrub-list/scrub-list.elements';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-list',
  templateUrl: './scrub-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CrontabExplanationPipe],
  standalone: true,
  imports: [
    PageHeaderComponent,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ScrubListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = scrubListElements;

  dataProvider: AsyncDataProvider<PoolScrubTask>;

  columns = createTable<PoolScrubTask>([
    textColumn({
      title: this.translate.instant('Pool'),
      propertyName: 'pool_name',
    }),
    textColumn({
      title: this.translate.instant('Threshold Days'),
      propertyName: 'threshold',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    scheduleColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'schedule',
      getValue: (task) => this.crontabExplanation.transform(scheduleToCrontab(task.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
        : this.translate.instant('Disabled')),
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.onDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => `scrub-task-${row.pool}-${row.description}`,
    ariaLabels: (row) => [row.pool_name, row.description, this.translate.instant('Scrub Task')],
  });

  constructor(
    private translate: TranslateService,
    private crontabExplanation: CrontabExplanationPipe,
    private taskService: TaskService,
    private ws: WebSocketService,
    private slideIn: SlideInService,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    protected emptyService: EmptyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.ws.call('pool.scrub.query'));
    this.dataProvider.load();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  protected onAdd(): void {
    this.slideIn.open(ScrubTaskFormComponent)
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onEdit(row: PoolScrubTask): void {
    this.slideIn.open(ScrubTaskFormComponent, { data: row })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  private onDelete(row: PoolScrubTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Task'),
      message: this.translate.instant('Are you sure you want to delete this task?'),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('pool.scrub.delete', [row.id]).pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => this.dataProvider.load());
  }
}
