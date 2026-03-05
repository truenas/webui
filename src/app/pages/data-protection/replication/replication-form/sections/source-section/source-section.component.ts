import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, input, OnChanges, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { emptyRootNode } from 'app/constants/basic-root-nodes.constant';
import { Direction } from 'app/enums/direction.enum';
import { SnapshotNamingOption, snapshotNamingOptionNames } from 'app/enums/snapshot-naming-option.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { regexValidator } from 'app/modules/forms/ix-forms/validators/regex-validation/regex-validation';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PropertiesOverrideValidatorService,
} from 'app/pages/data-protection/replication/replication-form/properties-override-validator/properties-override-validator.service';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-replication-source-section',
  templateUrl: './source-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PropertiesOverrideValidatorService,
  ],
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxExplorerComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxSelectComponent,
    SchedulerComponent,
    IxRadioGroupComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class SourceSectionComponent implements OnChanges, OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private taskService = inject(TaskService);
  private translate = inject(TranslateService);
  private propertiesOverrideValidator = inject(PropertiesOverrideValidatorService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly replication = input<ReplicationTask>();
  readonly direction = input<Direction>();
  readonly nodeProvider = input<TreeNodeProvider>();

  form = this.formBuilder.group({
    source_datasets: [[] as string | string[], Validators.required],
    recursive: [false],
    exclude: [[] as string[]],
    properties: [true],
    replicate: [false],
    properties_override: [[] as string[], this.propertiesOverrideValidator.validate],
    properties_exclude: [[] as string[]],
    periodic_snapshot_tasks: [[] as number[]],
    restrict_schedule: [false],
    restrict_schedule_picker: [CronPresetValue.Daily as string],
    restrict_schedule_begin: ['00:00'],
    restrict_schedule_end: ['23:59'],
    schema_or_regex: [SnapshotNamingOption.NamingSchema],
    naming_schema: [[] as string[]],
    also_include_naming_schema: [[] as string[]],
    name_regex: ['', [regexValidator()]],
    hold_pending_snapshots: [false],
  });

  protected readonly emptyRootNode = [emptyRootNode];

  readonly timeOptions$ = of(this.taskService.getTimeOptions());
  readonly snapshotNamingOptions$ = of(mapToOptions(snapshotNamingOptionNames, this.translate));

  readonly periodicSnapshotTasks$ = this.api.call('pool.snapshottask.query').pipe(map((tasks) => {
    return tasks.map((task) => {
      const enabledMessage = task.enabled
        ? this.translate.instant('Enabled')
        : this.translate.instant('Disabled');
      const label = `${task.dataset} - ${task.naming_schema} - ${task.lifetime_value} ${task.lifetime_unit} (S) - ${enabledMessage}`;
      return {
        label,
        value: task.id,
      };
    });
  }));

  protected readonly helptext = helptextReplication;
  protected readonly CronPresetValue = CronPresetValue;

  private formValuesApplied = false;

  ngOnChanges(): void {
    if (this.replication() && !this.formValuesApplied) {
      this.formValuesApplied = true;
      this.setFormValues(this.replication());
    }

    if (this.nodeProvider()) {
      this.form.controls.source_datasets.enable();
    } else {
      this.form.controls.source_datasets.disable();
    }
  }

  ngOnInit(): void {
    this.listenForRegexConflict();
  }

  protected isPush = computed(() => {
    return this.direction() === Direction.Push;
  });

  get usesNamingSchema(): boolean {
    return this.form.controls.schema_or_regex.value === SnapshotNamingOption.NamingSchema;
  }

  protected nameOrRegexLabel = computed(() => {
    return this.isPush()
      ? this.translate.instant('Also include snapshots with the name')
      : this.translate.instant('Include snapshots with the name');
  });

  setFormValues(replication: ReplicationTask): void {
    this.form.patchValue({
      ...replication,
      periodic_snapshot_tasks: replication.periodic_snapshot_tasks?.map((task) => task.id) || [],
      restrict_schedule: Boolean(replication.restrict_schedule),
      properties_override: Object.entries(replication.properties_override || {})
        .map(([key, value]) => `${key}=${String(value)}`),
      schema_or_regex: replication.name_regex ? SnapshotNamingOption.NameRegex : SnapshotNamingOption.NamingSchema,
    });

    if (this.replication()?.restrict_schedule) {
      this.form.patchValue({
        restrict_schedule_picker: replication.restrict_schedule
          ? scheduleToCrontab(replication.restrict_schedule)
          : null,
        restrict_schedule_begin: replication.restrict_schedule?.begin || '00:00',
        restrict_schedule_end: replication.restrict_schedule?.end || '23:59',
      });
    }
  }

  getPayload(): Partial<ReplicationCreate> {
    const values = this.form.getRawValue();
    const sourceDatasets = Array.isArray(values.source_datasets)
      ? values.source_datasets as string[]
      : [values.source_datasets];

    const payload: Partial<ReplicationCreate> = {
      source_datasets: sourceDatasets,
      properties_exclude: values.properties_exclude,
      properties_override: this.getPropertiesOverride(),
      properties: values.properties,
      recursive: values.recursive,
      replicate: values.replicate,
      hold_pending_snapshots: values.hold_pending_snapshots,
      exclude: values.exclude,
    };

    if (this.isPush()) {
      payload.periodic_snapshot_tasks = values.periodic_snapshot_tasks;
    } else {
      payload.periodic_snapshot_tasks = [];
    }

    if (values.restrict_schedule) {
      payload.restrict_schedule = {
        ...crontabToSchedule(values.restrict_schedule_picker),
        begin: values.restrict_schedule_begin,
        end: values.restrict_schedule_end,
      };
    } else {
      payload.restrict_schedule = null;
    }

    if (values.replicate) {
      payload.recursive = true;
      payload.properties = true;
      payload.exclude = [];
    }

    if (this.isPush()) {
      payload.naming_schema = [];
      payload.name_regex = null;
      payload.also_include_naming_schema = this.usesNamingSchema
        ? values.also_include_naming_schema
        : [];
      if (!this.usesNamingSchema) {
        payload.name_regex = values.name_regex;
      }
    } else if (this.usesNamingSchema) {
      payload.naming_schema = values.naming_schema;
      payload.also_include_naming_schema = values.also_include_naming_schema;
      payload.name_regex = null;
    } else {
      payload.naming_schema = [];
      payload.also_include_naming_schema = [];
      payload.name_regex = values.name_regex;
    }

    return payload;
  }

  private listenForRegexConflict(): void {
    merge(
      this.form.controls.schema_or_regex.valueChanges,
      this.form.controls.name_regex.valueChanges,
      this.form.controls.periodic_snapshot_tasks.valueChanges,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.validateRegexConflict();
    });
  }

  private validateRegexConflict(): void {
    const usesRegex = this.form.controls.schema_or_regex.value === SnapshotNamingOption.NameRegex;
    const hasRegex = Boolean(this.form.controls.name_regex.value);
    const hasTasks = this.form.controls.periodic_snapshot_tasks.value?.length > 0;

    if (usesRegex && hasRegex && hasTasks) {
      this.form.controls.name_regex.setErrors({
        ...this.form.controls.name_regex.errors,
        [ixManualValidateError]: {
          message: this.translate.instant('Naming regex cannot be used with periodic snapshot tasks.'),
        },
      });
    } else {
      const errors = this.form.controls.name_regex.errors;
      if (errors?.[ixManualValidateError]) {
        delete errors[ixManualValidateError];
        this.form.controls.name_regex.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    this.cdr.markForCheck();
  }

  private getPropertiesOverride(): ReplicationCreate['properties_override'] {
    return this.form.getRawValue().properties_override.reduce((overrides, property) => {
      const [key, value] = property.split('=');
      overrides[key] = value;
      return overrides;
    }, {} as ReplicationCreate['properties_override']);
  }
}
