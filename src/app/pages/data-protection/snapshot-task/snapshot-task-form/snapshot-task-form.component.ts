import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-task-form',
  templateUrl: './snapshot-task-form.component.html',
  styleUrls: ['./snapshot-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    IxInputComponent,
    SchedulerComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class SnapshotTaskFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SnapshotTaskWrite];

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

  protected isLoading = signal(false);
  protected editingTask: PeriodicSnapshotTask | undefined;

  readonly labels = {
    dataset: helptextSnapshotForm.datasetLabel,
    exclude: helptextSnapshotForm.excludeLabel,
    recursive: helptextSnapshotForm.recursiveLabel,
    lifetime: helptextSnapshotForm.lifetimeLabel,
    naming_schema: helptextSnapshotForm.namingSchemaLabel,
    schedule: helptextSnapshotForm.scheduleLabel,
    begin: helptextSnapshotForm.beginLabel,
    end: helptextSnapshotForm.endLabel,
    allow_empty: helptextSnapshotForm.allowEmptyLabel,
    enabled: helptextSnapshotForm.enabledLabel,
  };

  readonly tooltips = {
    exclude: helptextSnapshotForm.excludeTooltip,
    recursive: helptextSnapshotForm.recursiveTooltip,
    lifetime: helptextSnapshotForm.lifetimeTooltip,
    naming_schema: helptextSnapshotForm.namingSchemaTooltip,
    schedule: helptextSnapshotForm.scheduleTooltip,
    begin: helptextSnapshotForm.beginTooltip,
    end: helptextSnapshotForm.endTooltip,
    allow_empty: helptextSnapshotForm.allowEmptyTooltip,
  };

  readonly datasetOptions$ = this.storageService.getDatasetNameOptions();
  readonly timeOptions$ = of(this.taskService.getTimeOptions());
  readonly lifetimeOptions$ = of(
    Object.values(LifetimeUnit).map((lifetime) => ({ label: lifetime, value: lifetime })),
  );

  constructor(
    private fb: NonNullableFormBuilder,
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private taskService: TaskService,
    private snackbar: SnackbarService,
    protected storageService: StorageService,
    public slideInRef: SlideInRef<PeriodicSnapshotTask | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingTask = slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingTask) {
      this.setTaskForEdit(this.editingTask);
    }
  }

  protected get isTimeMode(): boolean {
    return this.form.value.schedule === CronPresetValue.Hourly as string;
  }

  protected setTaskForEdit(task: PeriodicSnapshotTask): void {
    this.form.patchValue({
      ...task,
      begin: task.schedule.begin,
      end: task.schedule.end,
      schedule: scheduleToCrontab(task.schedule),
    });
  }

  protected onSubmit(): void {
    const values = this.form.value;

    const params = {
      ...values,
      schedule: this.isTimeMode
        ? {
            begin: values.begin,
            end: values.end,
            ...crontabToSchedule(this.form.getRawValue().schedule),
          }
        : crontabToSchedule(this.form.getRawValue().schedule),
    };
    delete params.begin;
    delete params.end;

    this.isLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingTask) {
      request$ = this.api.call('pool.snapshottask.update', [
        this.editingTask.id,
        params as PeriodicSnapshotTaskUpdate,
      ]);
    } else {
      request$ = this.api.call('pool.snapshottask.create', [params as PeriodicSnapshotTaskCreate]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
