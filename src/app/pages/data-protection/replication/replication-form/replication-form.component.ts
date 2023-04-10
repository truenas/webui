import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { preparePayload } from 'app/pages/data-protection/replication/replication-form/utils/prepare-payload.utils';
import _ from 'lodash';
import { merge, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { CompressionType, compressionTypeNames } from 'app/enums/compression-type.enum';
import { Direction, directionNames } from 'app/enums/direction.enum';
import { EncryptionKeyFormat, encryptionKeyFormatNames } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { LoggingLevel, loggingLevelNames } from 'app/enums/logging-level.enum';
import { NetcatMode, netcatModeNames } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode, readonlyModeNames } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy, retentionPolicyNames } from 'app/enums/retention-policy.enum';
import { SnapshotNamingOption, snapshotNamingOptionNames } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { idNameArrayToOptions, mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/data-protection/replication/replication';
import globalHelptext from 'app/helptext/global-helptext';
import { CountManualSnapshotsParams } from 'app/interfaces/count-manual-snapshots.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import {
  PropertiesOverrideValidatorService,
} from 'app/pages/data-protection/replication/replication-form/properties-override-validator/properties-override-validator.service';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import {
  KeychainCredentialService,
  ModalService,
  ReplicationService,
  TaskService,
  WebSocketService,
} from 'app/services';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

// TODO: Test what happens when ssh credential is no longer valid
// TODO: Port recent changes by Alex about showing one field but not the other
@UntilDestroy()
@Component({
  templateUrl: './replication-form.component.html',
  styleUrls: ['./replication-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PropertiesOverrideValidatorService,
    ReplicationService,
  ],
})
export class ReplicationFormComponent implements OnInit {
  form = this.formBuilder.group({
    // General
    name: ['', Validators.required],
    direction: [Direction.Push],
    transport: [TransportMode.Ssh],
    retries: [5],
    logging_level: [LoggingLevel.Default],
    enabled: [true],

    // Transport Options
    ssh_credentials: [null as number, Validators.required], // TODO: Really required?
    netcat_active_side: [NetcatMode.Local],
    netcat_active_side_listen_address: [''],
    netcat_active_side_port_min: [null as number],
    netcat_active_side_port_max: [null as number],
    netcat_passive_side_connect_address: [''],
    compression: [CompressionType.Disabled],
    speed_limit: [null as number],
    large_block: [true],
    compressed: [true],

    // Source
    source_datasets: [null as string | string[], Validators.required],
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
    name_regex: [''],
    hold_pending_snapshots: [false],

    // Destination
    target_dataset: [null as string, Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex],
    encryption_key_generate: [true],
    encryption_key: [''],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number],
    lifetime_unit: [LifetimeUnit.Week],

    // Schedule
    auto: [true],
    schedule: [false],
    schedule_picker: [CronPresetValue.Daily as string],
    schedule_begin: ['00:00'],
    schedule_end: ['23:59'],
    only_matching_schedule: [false],
  });

  isLoading = false;
  existingReplication: ReplicationTask;

  readonly helptext = helptext;
  readonly EncryptionKeyFormat = EncryptionKeyFormat;
  readonly RetentionPolicy = RetentionPolicy;
  readonly CronPresetValue = CronPresetValue;

  readonly transports$ = of([
    {
      label: 'SSH',
      value: TransportMode.Ssh,
    },
    {
      label: 'SSH+NETCAT',
      value: TransportMode.Netcat,
    },
    {
      label: this.translate.instant('LOCAL'),
      value: TransportMode.Local,
    },
  ]);

  readonly sshCredentials$ = this.keychainCredentials.getSshConnections().pipe(idNameArrayToOptions());

  readonly sizeSuggestion = this.translate.instant(globalHelptext.human_readable.suggestion_label);

  readonly periodicSnapshotTasks$ = this.ws.call('pool.snapshottask.query').pipe(map((tasks) => {
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

  readonly directions$ = of(mapToOptions(directionNames, this.translate));
  readonly netcatActiveSides$ = of(mapToOptions(netcatModeNames, this.translate));
  readonly loggingLevels$ = of(mapToOptions(loggingLevelNames, this.translate));
  readonly snapshotNamingOptions$ = of(mapToOptions(snapshotNamingOptionNames, this.translate));
  readonly readonlyModes$ = of(mapToOptions(readonlyModeNames, this.translate));
  readonly encryptionKeyFormats$ = of(mapToOptions(encryptionKeyFormatNames, this.translate));
  readonly retentionPolicies$ = of(mapToOptions(retentionPolicyNames, this.translate));
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));
  readonly compressions$ = of(mapToOptions(compressionTypeNames, this.translate));
  readonly timeOptions$ = of(this.taskService.getTimeOptions());

  sourceNodeProvider: TreeNodeProvider;
  destinationNodeProvider: TreeNodeProvider;

  eligibleSnapshotsMessage = '';
  isEligibleSnapshotsMessageRed = false;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private keychainCredentials: KeychainCredentialService,
    public formatter: IxFormatterService,
    private slideIn: IxSlideInService,
    private modalService: ModalService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private propertiesOverrideValidator: PropertiesOverrideValidatorService,
    private datasetService: DatasetService,
    private replicationService: ReplicationService,
  ) {}

  ngOnInit(): void {
    this.countSnapshotsOnChanges();
    this.updateExplorersOnChanges();
    this.updateExplorers();
  }

  get isNew(): boolean {
    return !this.existingReplication;
  }

  // TODO: Get rid of getters or not.
  get isLocal(): boolean {
    return this.form.get('transport').value === TransportMode.Local;
  }

  get isNetcat(): boolean {
    return this.form.get('transport').value === TransportMode.Netcat;
  }

  get isSsh(): boolean {
    return this.form.get('transport').value === TransportMode.Ssh;
  }

  get isPush(): boolean {
    return this.form.get('direction').value === Direction.Push;
  }

  get usesNamingSchema(): boolean {
    return this.form.get('schema_or_regex').value === SnapshotNamingOption.NamingSchema;
  }

  get nameOrRegexLabel(): string {
    return this.isPush
      ? this.translate.instant('Also include snapshots with the name')
      : this.translate.instant('Include snapshots with the name');
  }

  setExistingReplication(replication: ReplicationTask): void {
    this.existingReplication = replication;

    const usesTruenasKeyDb = replication.encryption_key_location === truenasDbKeyLocation;
    const formValues = {
      ...replication,
      ssh_credentials: replication.ssh_credentials?.id || null,
      compression: replication.compression || CompressionType.Disabled,
      logging_level: replication.logging_level || LoggingLevel.Default,
      periodic_snapshot_tasks: replication.periodic_snapshot_tasks?.map((task) => task.id) || [],

      schedule: Boolean(replication.schedule),
      schedule_picker: replication.schedule ? scheduleToCrontab(replication.schedule) : null,
      schedule_begin: replication.schedule?.begin || '00:00',
      schedule_end: replication.schedule?.end || '23:59',

      restrict_schedule: Boolean(replication.restrict_schedule),
      restrict_schedule_picker: replication.restrict_schedule ? scheduleToCrontab(replication.restrict_schedule) : null,
      restrict_schedule_begin: replication.restrict_schedule?.begin || '00:00',
      restrict_schedule_end: replication.restrict_schedule?.end || '23:59',

      properties_override: Object.entries(replication.properties_override || {})
        .map(([key, value]) => `${key}=${String(value)}`),
      encryption_key_location_truenasdb: usesTruenasKeyDb,
      encryption_key_location: usesTruenasKeyDb ? '' : replication.encryption_key_location,
      schema_or_regex: replication.name_regex ? SnapshotNamingOption.NameRegex : SnapshotNamingOption.NamingSchema,
    } as ReplicationFormComponent['form']['value'];

    if (replication.large_block) {
      this.form.controls.large_block.disable();
    } else {
      this.form.controls.large_block.enable();
    }

    this.form.patchValue(formValues);
  }

  onSubmit(): void {
    const payload = preparePayload(this.form.value);

    const operation$ = this.isNew
      ? this.ws.call('replication.create', [payload])
      : this.ws.call('replication.update', [this.existingReplication.id, payload]);

    this.isLoading = true;
    operation$
      .pipe(untilDestroyed(this))
      .subscribe(
        {
          next: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
            this.slideIn.close();
          },
          error: (error) => {
            this.isLoading = false;
            this.cdr.markForCheck();
            this.errorHandler.handleWsFormError(error, this.form);
          },
        },
      );
  }

  onSwitchToWizard(): void {
    this.slideIn.close();
    this.modalService.openInSlideIn(ReplicationWizardComponent, this.existingReplication?.id);
  }

  private countSnapshotsOnChanges(): void {
    const observedAttributes = [
      'name_regex',
      'transport',
      'target_dataset',
      'direction',
      'also_include_naming_schema',
    ] as const;
    merge(
      ...observedAttributes.map((attribute) => this.form.controls[attribute].valueChanges),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.countEligibleManualSnapshots();
      });
  }

  private get canCountSnapshots(): boolean {
    const formValues = this.form.value;
    return this.isPush
      && !this.isLocal
      && formValues.ssh_credentials
      && (Boolean(formValues.name_regex) || formValues.also_include_naming_schema.length > 0);
  }

  private countEligibleManualSnapshots(): void {
    if (!this.canCountSnapshots) {
      this.eligibleSnapshotsMessage = '';
      return;
    }

    const formValues = this.form.value;
    const payload: CountManualSnapshotsParams = {
      datasets: [formValues.target_dataset],
      transport: formValues.transport,
      ssh_credentials: formValues.ssh_credentials,
    };

    if (formValues.schema_or_regex === SnapshotNamingOption.NamingSchema) {
      payload.naming_schema = formValues.also_include_naming_schema;
    } else {
      payload.name_regex = formValues.name_regex;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    this.ws.call('replication.count_eligible_manual_snapshots', [payload])
      .pipe(untilDestroyed(this))
      .subscribe(
        {
          next: (eligibleSnapshots) => {
            this.isEligibleSnapshotsMessageRed = eligibleSnapshots.eligible === 0;
            this.eligibleSnapshotsMessage = this.translate.instant(
              '{eligible} of {total} existing snapshots of dataset {targetDataset} would be replicated with this task.',
              {
                eligible: eligibleSnapshots.eligible,
                total: eligibleSnapshots.total,
                targetDataset: formValues.target_dataset,
              },
            );
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            this.isEligibleSnapshotsMessageRed = true;
            this.eligibleSnapshotsMessage = this.translate.instant('Error counting eligible snapshots.');
            if ('reason' in error) {
              this.eligibleSnapshotsMessage = `${this.eligibleSnapshotsMessage} ${error.reason}`;
            }

            this.isLoading = false;
            this.cdr.markForCheck();
          },
        },
      );
  }

  private preparePayload(): ReplicationCreate {
    const formValues = this.form.value as Required<ReplicationFormComponent['form']['value']>;
    const processedFields = [
      'schema_or_regex',
      'restrict_schedule',
      'encryption_key_location_truenasdb',
      'properties_override',
    ] as const;

    let payload = _.omit(formValues, processedFields) as ReplicationCreate;
    // TODO: Maybe clear dataset properties from 'mnt'
    payload = {
      ...payload,
      source_datasets: Array.isArray(formValues.source_datasets)
        ? formValues.source_datasets as string[]
        : [formValues.source_datasets],
      schedule: {
        ...crontabToSchedule(formValues.schedule_picker),
        begin: formValues.schedule_begin,
        end: formValues.schedule_end,
      },
      properties_override: this.getPropertiesOverrideForSubmit(),
      compression: formValues.compression === CompressionType.Disabled ? null : formValues.compression,
      logging_level: formValues.logging_level === LoggingLevel.Default ? null : formValues.logging_level,
    };

    if (this.usesNamingSchema) {
      payload = {
        ...payload,
        naming_schema: formValues.naming_schema,
        also_include_naming_schema: formValues.also_include_naming_schema,
      };
    } else {
      payload = {
        ...payload,
        name_regex: formValues.name_regex,
      };
    }

    if (payload.replicate) {
      payload.recursive = true;
      payload.properties = true;
      payload.exclude = [];
    }

    if (formValues.restrict_schedule) {
      payload.restrict_schedule = {
        ...crontabToSchedule(formValues.restrict_schedule_picker),
        begin: formValues.restrict_schedule_begin,
        end: formValues.restrict_schedule_end,
      };
    }

    if (formValues.encryption_key_location_truenasdb) {
      payload.encryption_key_location = truenasDbKeyLocation;
    }

    if (formValues.encryption_key_format === EncryptionKeyFormat.Hex && formValues.encryption_key_generate) {
      payload.encryption_key = this.replicationService.generateEncryptionHexKey(64);
    }

    return payload;
  }

  private updateExplorersOnChanges(): void {
    merge(
      this.form.controls.direction.valueChanges,
      this.form.controls.transport.valueChanges,
      this.form.controls.ssh_credentials.valueChanges,
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => this.updateExplorers());
  }

  private updateExplorers(): void {
    const controls = this.form.controls;
    const localProvider = this.datasetService.getDatasetNodeProvider();
    let remoteProvider: TreeNodeProvider = null;
    if (controls.ssh_credentials.value) {
      remoteProvider = this.replicationService.getTreeNodeProvider({
        transport: controls.transport.value,
        sshCredential: controls.ssh_credentials.value,
      });
    }

    this.sourceNodeProvider = this.isPush ? localProvider : remoteProvider;
    this.destinationNodeProvider = this.isPush && !this.isLocal ? remoteProvider : localProvider;

    // TODO: Clearing source value may be a bit annoying in some scenarios.
    this.form.patchValue({
      source_datasets: [],
      target_dataset: null,
    });

    if (this.sourceNodeProvider) {
      controls.source_datasets.enable();
    } else {
      controls.source_datasets.disable();
    }

    if (this.destinationNodeProvider) {
      controls.target_dataset.enable();
    } else {
      controls.target_dataset.disable();
    }
  }
}
