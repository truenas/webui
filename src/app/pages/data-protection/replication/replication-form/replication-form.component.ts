import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import {
  PropertiesOverrideValidatorService,
} from 'app/pages/data-protection/replication/replication-form/properties-override-validator/properties-override-validator.service';
import {
  ReplicationWizardComponent,
} from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import {
  KeychainCredentialService, ModalService, TaskService, WebSocketService,
} from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './replication-form.component.html',
  styleUrls: ['./replication-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    PropertiesOverrideValidatorService,
  ],
})
export class ReplicationFormComponent implements OnInit {
  // TODO: Break into groups
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
    source_datasets: [[] as string[], Validators.required],
    recursive: [false],
    exclude: [[] as string[]],
    properties: [true],
    replicate: [false],
    properties_override: [[] as string[], this.propertiesOverrideValidator.validate],
    properties_exclude: [[] as string[]],
    periodic_snapshot_tasks: [[] as string[]],
    restrict_schedule: [false],
    restrict_schedule_picker: [CronPresetValue.Daily],
    restrict_schedule_begin: ['00:00'],
    restrict_schedule_end: ['23:59'],
    schema_or_regex: [SnapshotNamingOption.NamingSchema],
    naming_schema: [[] as string[]],
    also_include_naming_schema: [[] as string[]],
    name_regex: [''],
    hold_pending_snapshots: [false],

    // Destination
    target_dataset: ['', Validators.required],
    readonly: [ReadOnlyMode.Require],
    encryption: [false],
    encryption_key_format: [EncryptionKeyFormat.Hex],
    encryption_key_generate: [true],
    encryption_key_hex: [''],
    encryption_key_passphrase: [''],
    encryption_key_location_truenasdb: [true],
    encryption_key_location: [''],
    allow_from_scratch: [false],
    retention_policy: [RetentionPolicy.None],
    lifetime_value: [null as number],
    lifetime_unit: [LifetimeUnit.Week],

    // Schedule
    auto: [true],
    schedule: [false],
    schedule_picker: [CronPresetValue.Daily],
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
      const label = `${task.dataset} - ${task.naming_schema} - ${task.lifetime_value} ${task.lifetime_unit} (S) - ${task.enabled ? 'Enabled' : 'Disabled'}`;
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

  readonly localNodeProvider = this.filesystemService.getFilesystemNodeProvider();

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
    private filesystemService: FilesystemService,
  ) {}

  ngOnInit(): void {
    this.countSnapshotsOnChanges();
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

  setExistingReplication(replication: ReplicationTask): void {
    this.existingReplication = replication;
    this.form.patchValue(replication as any);
  }

  onSubmit(): void {

  }

  onSwitchToWizard(): void {
    this.slideIn.close();
    this.modalService.openInSlideIn(ReplicationWizardComponent, this.existingReplication?.id);
  }

  private countSnapshotsOnChanges(): void {
    merge(
      this.form.get('name_regex').valueChanges,
      this.form.get('transport').valueChanges,
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
      && (Boolean(formValues.name_regex) || formValues.also_include_naming_schema.length > 0);
  }

  private countEligibleManualSnapshots(): void {
    if (!this.canCountSnapshots) {
      return;
    }

    const formValues = this.form.value;
    const payload: CountManualSnapshotsParams = {
      datasets: [], // TODO:
      transport: formValues.transport,
      ssh_credentials: formValues.ssh_credentials, // TODO: shouldn't this be in canCountSnapshots?
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
        () => {

        },
        () => {

        },
      );
  }
}
