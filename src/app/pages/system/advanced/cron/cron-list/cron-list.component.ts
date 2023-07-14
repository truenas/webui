import {
  AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { CatalogDeleteDialogComponent } from 'app/pages/apps/components/catalogs/catalog-delete-dialog/catalog-delete-dialog.component';
import { CronFormComponent } from 'app/pages/system/advanced/cron/cron-form/cron-form.component';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import {
  DialogService, TaskService, WebSocketService,
} from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './cron-list.component.html',
  styleUrls: ['./cron-list.component.scss'],
})
export class CronListComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  cronjobs: CronjobRow[] = [];
  filterString = '';
  isLoading = false;
  dataProvider = new ArrayDataProvider<CronjobRow>();
  columns = createTable<CronjobRow>([
    textColumn({
      title: this.translate.instant('Users'),
      propertyName: 'user',
    }),
    textColumn({
      title: this.translate.instant('Command'),
      propertyName: 'command',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'cron_schedule',
    }),
    textColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      propertyName: 'next_run',
    }),
    // textColumn({
    //   title: this.translate.instant('Minute'),
    //   propertyName: 'schedule.minute',
    // }),
    // textColumn({
    //   title: this.translate.instant('Hour'),
    //   propertyName: 'schedule.hour',
    // }),
    // textColumn({
    //   title: this.translate.instant('Day of Month'),
    //   propertyName: 'schedule.dom',
    // }),
    // textColumn({
    //   title: this.translate.instant('Month'),
    //   propertyName: 'schedule.month',
    // }),
    // textColumn({
    //   title: this.translate.instant('Day of Week'),
    //   propertyName: 'schedule.dow',
    // }),
    textColumn({
      title: this.translate.instant('Hide Stdout'),
      propertyName: 'stdout',
    }),
    textColumn({
      title: this.translate.instant('Hide Stderr'),
      propertyName: 'stderr',
    }),
    textColumn({
      propertyName: 'id',
    }),
  ]);

  constructor(
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private taskService: TaskService,
    private dialog: DialogService,
    private errorHandler: ErrorHandlerService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.getCronJobs();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getCronJobs(): void {
    this.isLoading = true;
    this.ws.call('cronjob.query').pipe(
      map((cronjobs) => {
        return cronjobs.map((job: CronjobRow) => {
          const cronSchedule = `${job.schedule.minute} ${job.schedule.hour} ${job.schedule.dom} ${job.schedule.month} ${job.schedule.dow}`;
          return {
            ...job,
            cron_schedule: cronSchedule,
            next_run: this.taskService.getTaskNextRun(cronSchedule),
          };
        });
      }),
      untilDestroyed(this),
    ).subscribe((cronjobs) => {
      this.cronjobs = cronjobs;
      this.dataProvider.setRows(cronjobs);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(CronFormComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  doEdit(row: CronjobRow): void {
    const slideInRef = this.slideInService.open(CronFormComponent, { data: row });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  runNow(row: CronjobRow): void {
    this.dialog.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run this job now?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cronjob.run', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        const message = row.enabled
          ? this.translate.instant('This job is scheduled to run again {nextRun}.', { nextRun: row.next_run })
          : this.translate.instant('This job will not run again until it is enabled.');
        this.dialog.info(
          this.translate.instant('Job {job} Completed Successfully', { job: row.description }),
          message,
        );
      },
      error: (error: WebsocketError) => this.dialog.error(this.errorHandler.parseWsError(error)),
    });
  }

  doDelete(row: CronjobRow): void {
    this.matDialog.open(CatalogDeleteDialogComponent, {
      data: row,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCronJobs();
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.cronjobs.filter((cronjob) => {
      return [cronjob.user.toString()].includes(this.filterString);
    }));
  }
}
