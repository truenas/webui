import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of, switchMap, debounceTime, combineLatest, startWith } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
  PeriodicSnapshotTaskUpdate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
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
    FormActionsComponent,
  ],
})
export class SnapshotTaskFormComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);
  private taskService = inject(TaskService);
  private snackbar = inject(SnackbarService);
  protected storageService = inject(StorageService);
  slideInRef = inject<SlideInRef<PeriodicSnapshotTask | undefined, boolean>>(SlideInRef);

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
    fixate_removal_date: [false],
  });

  protected isLoading = signal(false);
  protected editingTask: PeriodicSnapshotTask | undefined;
  protected affectedSnapshots = signal<string[]>([]);

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
    fixate_removal_date: helptextSnapshotForm.fixateRemovalDateLabel,
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
    fixate_removal_date: helptextSnapshotForm.fixateRemovalDateTooltip,
  };

  readonly datasetOptions$ = this.storageService.getDatasetNameOptions();
  readonly timeOptions$ = of(this.taskService.getTimeOptions());
  readonly lifetimeOptions$ = of(
    Object.values(LifetimeUnit).map((lifetime) => ({ label: lifetime, value: lifetime })),
  );

  constructor() {
    const slideInRef = this.slideInRef;

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingTask = slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingTask) {
      this.setTaskForEdit(this.editingTask);
      this.setupRetentionChangeDetection();
    }
  }

  private setupRetentionChangeDetection(): void {
    if (!this.editingTask) {
      return;
    }

    // Watch for changes in fields that affect retention
    const relevantFields$ = combineLatest([
      this.form.controls.naming_schema.valueChanges.pipe(startWith(this.form.controls.naming_schema.value)),
      this.form.controls.schedule.valueChanges.pipe(startWith(this.form.controls.schedule.value)),
      this.form.controls.lifetime_value.valueChanges.pipe(startWith(this.form.controls.lifetime_value.value)),
      this.form.controls.lifetime_unit.valueChanges.pipe(startWith(this.form.controls.lifetime_unit.value)),
      this.form.controls.begin.valueChanges.pipe(startWith(this.form.controls.begin.value)),
      this.form.controls.end.valueChanges.pipe(startWith(this.form.controls.end.value)),
    ]);

    relevantFields$.pipe(
      debounceTime(250),
      switchMap(() => {
        const values = this.form.value;
        const {
          begin,
          end,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          fixate_removal_date,
          ...restValues
        } = values;
        const params = {
          ...restValues,
          schedule: this.isTimeMode
            ? {
                begin,
                end,
                ...crontabToSchedule(this.form.getRawValue().schedule),
              }
            : crontabToSchedule(this.form.getRawValue().schedule),
        };

        return this.api.call('pool.snapshottask.update_will_change_retention_for', [
          this.editingTask.id,
          params as PeriodicSnapshotTaskUpdate,
        ]);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (response: Record<string, string[]>) => {
        // Flatten all affected snapshots from all change types
        const allAffectedSnapshots = Object.values(response).flat();
        this.affectedSnapshots.set(allAffectedSnapshots);
      },
      error: (error: unknown) => {
        this.affectedSnapshots.set([]);
        console.error('Failed to check affected snapshots:', error);
      },
    });
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
    const {
      begin, end, fixate_removal_date: fixateRemovalDate, ...restValues
    } = values;

    const params = {
      ...restValues,
      schedule: this.isTimeMode
        ? {
            begin,
            end,
            ...crontabToSchedule(this.form.getRawValue().schedule),
          }
        : crontabToSchedule(this.form.getRawValue().schedule),
      // Only include fixate_removal_date when updating (not creating)
      ...(!this.isNew && { fixate_removal_date: fixateRemovalDate }),
    };

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
