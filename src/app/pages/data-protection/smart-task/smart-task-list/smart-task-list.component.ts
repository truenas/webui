import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSmart } from 'app/helptext/data-protection/smart/smart';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './smart-task-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTaskListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  smartTasks: SmartTestTaskUi[] = [];
  dataProvider: AsyncDataProvider<SmartTestTaskUi>;
  disks: Disk[] = [];
  filterString: string;

  columns = createTable<SmartTestTaskUi>([
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_disks),
      propertyName: 'disksLabel',
    }),
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_type),
      propertyName: 'type',
    }),
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_description),
      propertyName: 'desc',
    }),
    textColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_frequency),
      propertyName: 'frequency',
      getValue: (row) => this.taskService.getTaskCronDescription(row.cron_schedule),
    }),
    relativeDateColumn({
      title: this.translate.instant(helptextSmart.smartlist_column_next_run),
      propertyName: 'next_run',
      getValue: (row) => this.taskService.getTaskNextTime(row.cron_schedule) as unknown,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'smart-task-' + row.type + '-' + row.disks.join(','),
  });

  constructor(
    protected emptyService: EmptyService,
    private storageService: StorageService,
    private slideInService: IxSlideInService,
    private taskService: TaskService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {
    this.storageService.listDisks().pipe(filter(Boolean), untilDestroyed(this)).subscribe((disks: Disk[]) => {
      this.disks = disks;
    });
  }

  ngOnInit(): void {
    const smartTasks$ = this.ws.call('smart.test.query').pipe(
      map((smartTasks: SmartTestTaskUi[]) => this.transformSmartTasks(smartTasks)),
      tap((smartTasks) => this.smartTasks = smartTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<SmartTestTaskUi>(smartTasks$);
    this.getSmartTasks();
  }

  getSmartTasks(): void {
    this.dataProvider.load();
  }

  openForm(row?: SmartTestTaskUi): void {
    const slideInRef = this.slideInService.open(SmartTaskFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getSmartTasks();
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.smartTasks.filter((smartTask) => {
      return smartTask.desc.includes(this.filterString) || smartTask.type.includes(this.filterString);
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private doDelete(smartTask: SmartTestTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete S.M.A.R.T. Test <b>"{name}"</b>?', {
        name: `${smartTask.type} - ${smartTask.desc}`,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('smart.test.delete', [smartTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getSmartTasks();
      },
      error: (error) => this.errorHandler.showErrorModal(error),
    });
  }

  private transformSmartTasks(smartTasks: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return smartTasks.map((test) => {
      test.cron_schedule = scheduleToCrontab(test.schedule);

      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptextSmart.smarttest_all_disks_placeholder)];
      } else if (test.disks.length) {
        test.disksLabel = [
          test.disks
            .map((identifier: string) => {
              const fullDisk = this.disks.find((item) => item.identifier === identifier);
              if (fullDisk) {
                return fullDisk.devname;
              }
              return identifier;
            })
            .join(','),
        ];
      }
      return test;
    });
  }
}
