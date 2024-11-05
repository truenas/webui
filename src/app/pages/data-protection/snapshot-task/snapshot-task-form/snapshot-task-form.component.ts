import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-task-form',
  templateUrl: './snapshot-task-form.component.html',
  styleUrls: ['./snapshot-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  readonly requiredRoles = [Role.FullAdmin];

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
    dataset: helptextSnapshotForm.dataset_placeholder,
    exclude: helptextSnapshotForm.exclude_placeholder,
    recursive: helptextSnapshotForm.recursive_placeholder,
    lifetime: helptextSnapshotForm.lifetime_placeholder,
    naming_schema: helptextSnapshotForm.naming_schema_placeholder,
    schedule: helptextSnapshotForm.snapshot_picker_placeholder,
    begin: helptextSnapshotForm.begin_placeholder,
    end: helptextSnapshotForm.end_placeholder,
    allow_empty: helptextSnapshotForm.allow_empty_placeholder,
    enabled: helptextSnapshotForm.enabled_placeholder,
  };

  readonly tooltips = {
    dataset: helptextSnapshotForm.dataset_tooltip,
    exclude: helptextSnapshotForm.exclude_tooltip,
    recursive: helptextSnapshotForm.recursive_tooltip,
    lifetime: helptextSnapshotForm.lifetime_tooltip,
    naming_schema: helptextSnapshotForm.naming_schema_tooltip,
    schedule: helptextSnapshotForm.snapshot_picker_tooltip,
    begin: helptextSnapshotForm.begin_tooltip,
    end: helptextSnapshotForm.end_tooltip,
    allow_empty: helptextSnapshotForm.allow_empty_tooltip,
    enabled: helptextSnapshotForm.enabled_tooltip,
  };

  readonly datasetOptions$ = this.storageService.getDatasetNameOptions();
  readonly timeOptions$ = of(this.taskService.getTimeOptions());
  readonly lifetimeOptions$ = of(
    Object.values(LifetimeUnit).map((lifetime) => ({ label: lifetime, value: lifetime })),
  );

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private snackbar: SnackbarService,
    protected storageService: StorageService,
    private slideInRef: SlideInRef<SnapshotTaskFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTask: PeriodicSnapshotTask,
  ) {}

  ngOnInit(): void {
    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  get isTimeMode(): boolean {
    return this.form.value.schedule === CronPresetValue.Hourly as string;
  }

  setTaskForEdit(): void {
    this.form.patchValue({
      ...this.editingTask,
      begin: this.editingTask.schedule.begin,
      end: this.editingTask.schedule.end,
      schedule: scheduleToCrontab(this.editingTask.schedule),
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
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
