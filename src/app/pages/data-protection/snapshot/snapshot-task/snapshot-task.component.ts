import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import helptext from 'app/helptext/data-protection/snapshot/snapshot-form';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { StorageService, TaskService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-task.component.html',
  styleUrls: ['./snapshot-task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotTaskComponent {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Periodic Snapshot Task')
      : this.translate.instant('Edit Periodic Snapshot Task');
  }

  form = this.fb.group({
    dataset: ['', Validators.required],
    exclude: [[] as string[]],
    recursive: [false],
    lifetime_value: [2, Validators.required],
    lifetime_unit: [LifetimeUnit.Week, Validators.required],
    naming_schema: ['auto-%Y-%m-%d_%H-%M', [Validators.required, Validators.pattern('[^/]+')]],
    schedule: [CronPresetValue.Daily as string, Validators.required],
    begin: ['00:00', Validators.required],
    end: ['23:59', Validators.required],
    allow_empty: [true],
    enabled: [true],
  });

  isLoading = false;

  readonly labels = {
    dataset: helptext.dataset_placeholder,
    exclude: helptext.exclude_placeholder,
    recursive: helptext.recursive_placeholder,
    lifetime: helptext.lifetime_placeholder,
    naming_schema: helptext.naming_schema_placeholder,
    schedule: helptext.snapshot_picker_placeholder,
    begin: helptext.begin_placeholder,
    end: helptext.end_placeholder,
    allow_empty: helptext.allow_empty_placeholder,
    enabled: helptext.enabled_placeholder,
  };

  readonly tooltips = {
    dataset: helptext.dataset_tooltip,
    exclude: helptext.exclude_tooltip,
    recursive: helptext.recursive_tooltip,
    lifetime: helptext.lifetime_tooltip,
    naming_schema: helptext.naming_schema_tooltip,
    schedule: helptext.snapshot_picker_tooltip,
    begin: helptext.begin_tooltip,
    end: helptext.end_tooltip,
    allow_empty: helptext.allow_empty_tooltip,
    enabled: helptext.enabled_tooltip,
  };

  readonly datasetOptions$ = this.storageService.getDatasetNameOptions();
  readonly timeOptions$ = of(this.taskService.getTimeOptions());
  readonly lifetimeOptions$ = of(
    Object.values(LifetimeUnit).map((lifetime) => ({ label: lifetime, value: lifetime })),
  );

  private editingTask: PeriodicSnapshotTask;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    protected storageService: StorageService,
  ) {}

  get isTimeMode(): boolean {
    return this.form.value.schedule === CronPresetValue.Hourly;
  }

  setTaskForEdit(task: PeriodicSnapshotTask): void {
    this.editingTask = task;
    this.form.patchValue({
      ...task,
      begin: task.schedule.begin,
      end: task.schedule.end,
      schedule: scheduleToCrontab(task.schedule),
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    const params = {
      ...values,
      schedule: this.isTimeMode
        ? {
          begin: values.begin,
          end: values.end,
          ...crontabToSchedule(this.form.value.schedule),
        }
        : crontabToSchedule(this.form.value.schedule),
    };
    delete params.begin;
    delete params.end;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('pool.snapshottask.create', [params as PeriodicSnapshotTaskCreate]);
    } else {
      request$ = this.ws.call('pool.snapshottask.update', [
        this.editingTask.id,
        params as PeriodicSnapshotTaskUpdate,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
