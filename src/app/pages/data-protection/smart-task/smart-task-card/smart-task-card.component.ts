import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, pipe, switchMap, tap } from 'rxjs';
import helptext_smart from 'app/helptext/data-protection/smart/smart';
import { SmartTestTaskUi } from 'app/interfaces/smart-test.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SmartTaskFormComponent } from 'app/pages/data-protection/smart-task/smart-task-form/smart-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smart-task-card',
  templateUrl: './smart-task-card.component.html',
  styleUrls: ['./smart-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTaskCardComponent implements OnInit {
  smartTasks: SmartTestTaskUi[] = [];
  dataProvider: AsyncDataProvider<SmartTestTaskUi>;
  disks: Disk[] = [];

  columns = createTable<SmartTestTaskUi>([
    textColumn({
      title: helptext_smart.smartlist_column_disks,
      propertyName: 'disksLabel',
    }),
    textColumn({
      title: helptext_smart.smartlist_column_type,
      getValue: (row) => row.type.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()),
    }),
    textColumn({
      title: helptext_smart.smartlist_column_description,
      propertyName: 'desc',
    }),
    textColumn({
      title: helptext_smart.smartlist_column_frequency,
      getValue: (row) => this.taskService.getTaskCronDescription(row.cron_schedule),
    }),
    relativeDateColumn({
      title: helptext_smart.smartlist_column_next_run,
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
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private storageService: StorageService,
    protected emptyService: EmptyService,
  ) {
    this.storageService.listDisks().pipe(filter(Boolean), untilDestroyed(this)).subscribe((disks: Disk[]) => {
      this.disks = disks;
    });
  }

  ngOnInit(): void {
    const smartTasks$ = this.ws.call('smart.test.query');
    this.dataProvider = new AsyncDataProvider<SmartTestTaskUi>(smartTasks$);
    this.getSmartTasks();
  }

  getSmartTasks(): void {
    this.dataProvider.load<SmartTestTaskUi[]>(() => pipe(
      map((smartTasks) => this.transformSmartTasks(smartTasks)),
      tap((smartTasks) => this.smartTasks = smartTasks),
      untilDestroyed(this),
    ));
  }

  doDelete(smartTask: SmartTestTaskUi): void {
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
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  openForm(row?: SmartTestTaskUi): void {
    const slideInRef = this.slideInService.open(SmartTaskFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getSmartTasks();
    });
  }

  private transformSmartTasks(smartTasks: SmartTestTaskUi[]): SmartTestTaskUi[] {
    return smartTasks.map((test) => {
      test.cron_schedule = scheduleToCrontab(test.schedule);

      if (test.all_disks) {
        test.disksLabel = [this.translate.instant(helptext_smart.smarttest_all_disks_placeholder)];
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
