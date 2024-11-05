import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { scrubTaskCardElements } from 'app/pages/data-protection/scrub-task/scrub-task-card/scrub-task-card.elements';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-task-card',
  templateUrl: './scrub-task-card.component.html',
  styleUrls: ['./scrub-task-card.component.scss'],
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
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ScrubTaskCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly uiSearchableElement = scrubTaskCardElements;

  dataProvider: AsyncDataProvider<PoolScrubTask>;

  columns = createTable<PoolScrubTask>([
    textColumn({
      title: this.translate.instant('Pool'),
      propertyName: 'pool_name',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      getValue: (task) => this.taskService.getTaskCronDescription(scheduleToCrontab(task.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
        : this.translate.instant('Disabled')),
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      requiredRoles: this.requiredRoles,
      onRowToggle: (row: PoolScrubTask) => this.onChangeEnabledState(row),
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
    uniqueRowTag: (row) => `card-scrub-task-${row.pool}-${row.description}`,
    ariaLabels: (row) => [row.pool.toString(), row.description, this.translate.instant('Scrub Task')],
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
    const scrubTasks$ = this.ws.call('pool.scrub.query');
    this.dataProvider = new AsyncDataProvider<PoolScrubTask>(scrubTasks$);
    this.getScrubTasks();
  }

  getScrubTasks(): void {
    this.dataProvider.load();
  }

  doDelete(scrubTask: PoolScrubTask): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Scrub Task <b>"{name}"</b>?', { name: scrubTask.pool_name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('pool.scrub.delete', [scrubTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getScrubTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  openForm(row?: PoolScrubTask): void {
    const slideInRef = this.slideInService.open(ScrubTaskFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getScrubTasks();
    });
  }

  private onChangeEnabledState(scrubTask: PoolScrubTask): void {
    this.ws
      .call('pool.scrub.update', [scrubTask.id, { enabled: !scrubTask.enabled } as PoolScrubTask])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getScrubTasks();
        },
        error: (err: unknown) => {
          this.getScrubTasks();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }
}
