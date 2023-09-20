import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { ScrubTaskUi } from 'app/interfaces/scrub-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ScrubTaskFormComponent } from 'app/pages/data-protection/scrub-task/scrub-task-form/scrub-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-task-card',
  templateUrl: './scrub-task-card.component.html',
  styleUrls: ['./scrub-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubTaskCardComponent implements OnInit {
  dataProvider = new ArrayDataProvider<ScrubTaskUi>();
  isLoading = false;

  columns = createTable<ScrubTaskUi>([
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
      propertyName: 'frequency',
      getValue: (task) => this.taskService.getTaskCronDescription(scheduleToCrontab(task.schedule)),
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      propertyName: 'next_run',
      getValue: (task) => this.taskService.getTaskNextRun(scheduleToCrontab(task.schedule)),
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      cssClass: 'justify-end',
      onRowToggle: (row: ScrubTaskUi) => this.onChangeEnabledState(row),
    }),
    textColumn({
      propertyName: 'id',
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
  ) {}

  ngOnInit(): void {
    this.getScrubTasks();
  }

  getScrubTasks(): void {
    this.isLoading = true;
    this.ws.call('pool.scrub.query').pipe(
      untilDestroyed(this),
    ).subscribe((scrubTasks: ScrubTaskUi[]) => {
      this.dataProvider.setRows(scrubTasks);
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  doDelete(scrubTask: ScrubTaskUi): void {
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

  openForm(row?: ScrubTaskUi): void {
    const slideInRef = this.slideInService.open(ScrubTaskFormComponent, { data: row });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getScrubTasks();
    });
  }

  private onChangeEnabledState(scrubTask: ScrubTaskUi): void {
    this.ws
      .call('pool.scrub.update', [scrubTask.id, { enabled: !scrubTask.enabled } as ScrubTaskUi])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getScrubTasks();
        },
        error: (err: WebsocketError) => {
          this.getScrubTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
