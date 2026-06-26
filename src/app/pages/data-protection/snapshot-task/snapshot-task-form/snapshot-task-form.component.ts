import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, of, switchMap, debounceTime, combineLatest, startWith,
} from 'rxjs';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSnapshotForm } from 'app/helptext/data-protection/snapshot/snapshot-form';
import {
  PeriodicSnapshotTask,
  PeriodicSnapshotTaskCreate,
} from 'app/interfaces/periodic-snapshot-task.interface';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotTaskService } from 'app/services/snapshot-task.service';
import { StorageService } from 'app/services/storage.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-snapshot-task-form',
  templateUrl: './snapshot-task-form.component.html',
  styleUrls: ['./snapshot-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnChipInputComponent,
    TnCheckboxComponent,
    TnInputComponent,
    SchedulerComponent,
    TranslateModule,
  ],
})
export class SnapshotTaskFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private snapshotTaskService = inject(SnapshotTaskService);
  private translate = inject(TranslateService);
  private taskService = inject(TaskService);
  protected storageService = inject(StorageService);
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the
  // `<tn-side-panel>` form panel, where data arrives via {@link taskToEdit}.
  private slideInRef = inject<SlideInRef<PeriodicSnapshotTask | undefined, boolean>>(SlideInRef, { optional: true });

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly taskToEdit = input<PeriodicSnapshotTask | undefined>(undefined);

  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingTask;
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
  protected retentionCheckError = signal(false);

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

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  /** Whether the form may be submitted right now; the `<tn-side-panel>` host reads this for its Save action. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  ngOnInit(): void {
    this.editingTask = this.slideInRef?.getData() ?? this.taskToEdit();

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

        return this.snapshotTaskService.checkUpdateWillChangeRetention(
          this.editingTask.id,
          params,
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (affectedSnapshots: string[]) => {
        this.affectedSnapshots.set(affectedSnapshots);
        this.retentionCheckError.set(false);
      },
      error: (error: unknown) => {
        this.affectedSnapshots.set([]);
        this.retentionCheckError.set(true);
        // Log to console only - this is a non-critical background check
        // that shouldn't create Sentry alerts or show error dialogs to users
        console.error('[SnapshotTaskForm] Failed to check retention changes:', error);
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

  protected handleSubmit = (): SubmitResult => {
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

    const request$: Observable<unknown> = this.editingTask
      // cspell:ignore snapshottask
      ? this.api.call('pool.snapshottask.update', [this.editingTask.id, params])
      : this.api.call('pool.snapshottask.create', [params as PeriodicSnapshotTaskCreate]);

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Task created')
        : this.translate.instant('Task updated'),
    };
  };
}
