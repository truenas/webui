import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { forkJoin, lastValueFrom, Observable } from 'rxjs';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { DatasetSource } from 'app/enums/dataset.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import helptext from 'app/helptext/data-protection/replication/replication-wizard';
import { CountManualSnapshotsParams, EligibleManualSnapshotsCount, TargetUnmatchedSnapshotsParams } from 'app/interfaces/count-manual-snapshots.interface';
import { PeriodicSnapshotTask, PeriodicSnapshotTaskCreate } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { CreateZfsSnapshot, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { ReplicationWizardData } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard-data.interface';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { DialogService, ReplicationService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './replication-wizard.component.html',
  styleUrls: ['./replication-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReplicationService],
})
export class ReplicationWizardComponent {
  @ViewChild(ReplicationWhatAndWhereComponent) whatAndWhere: ReplicationWhatAndWhereComponent;
  @ViewChild(ReplicationWhenComponent) when: ReplicationWhenComponent;

  rowId: number;
  isLoading = false;
  toStop = false;
  summary: SummarySection[];
  defaultNamingSchema = 'auto-%Y-%m-%d_%H-%M';

  eligibleSnapshots = 0;
  existSnapshotTasks: number[] = [];
  createdSnapshots: ZfsSnapshot[] = [];
  createdSnapshotTasks: PeriodicSnapshotTask[] = [];
  createdReplication: ReplicationTask;

  constructor(
    private ws: WebSocketService,
    private replicationService: ReplicationService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) {}

  setRowId(id: number): void {
    this.rowId = id;
  }

  getSteps(): [
    ReplicationWhatAndWhereComponent,
    ReplicationWhenComponent,
  ] {
    return [this.whatAndWhere, this.when];
  }

  updateSummary(): void {
    const stepsWithSummary = this.getSteps();
    this.summary = stepsWithSummary.map((step) => step.getSummary());
  }

  rollBack(): void {
    const requests: Observable<unknown>[] = [];

    this.createdSnapshots.forEach((snapshot) => {
      requests.push(this.ws.call('zfs.snapshot.delete', [snapshot.name]));
    });

    this.createdSnapshotTasks.forEach((task) => {
      requests.push(this.ws.call('pool.snapshottask.delete', [task.id]));
    });

    if (requests.length) {
      forkJoin(requests).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    this.toStop = false;

    this.createdSnapshots = [];
    this.createdSnapshotTasks = [];
    this.createdReplication = undefined;

    const values = this.preparePayload();

    const snapshotsCountPayload = this.getSnapshotsCountPayload(values);
    if (snapshotsCountPayload) {
      await this.getSnapshotsСount(snapshotsCountPayload).then(
        (snapshotCount) => this.eligibleSnapshots = snapshotCount.eligible,
        (err: WebsocketError) => {
          this.eligibleSnapshots = 0;
          this.toStop = true;
          this.handleError(err);
        },
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (values.schedule_method === ScheduleMethod.Cron && values.source_datasets_from === DatasetSource.Local) {
      this.existSnapshotTasks = [];
      for (const payload of this.getPeriodicSnapshotTasksPayload(values)) {
        await this.isSnapshotTaskExist(payload).then(async (tasks) => {
          if (tasks.length === 0) {
            await this.createPeriodicSnapshotTask(payload).then(
              (createdSnapshotTask) => this.createdSnapshotTasks.push(createdSnapshotTask),
              (err: WebsocketError) => {
                this.toStop = true;
                this.handleError(err);
              },
            );
          } else {
            this.existSnapshotTasks.push(...tasks.map((task) => task.id));
          }
        });
      }
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (this.eligibleSnapshots === 0 && values.source_datasets_from === DatasetSource.Local) {
      for (const payload of this.getSnapshotsPayload(values)) {
        await this.createSnapshot(payload).then(
          (createdSnapshot) => this.createdSnapshots.push(createdSnapshot),
          (err: WebsocketError) => {
            this.toStop = true;
            this.handleError(err);
          },
        );
      }
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    const replicationPayload = this.getReplicationPayload(values);
    await this.getUnmatchedSnapshots([
      replicationPayload.direction,
      replicationPayload.source_datasets,
      replicationPayload.target_dataset,
      replicationPayload.transport,
      replicationPayload.ssh_credentials,
    ]).then(
      async (unmatchedSnapshots) => {
        const hasBadSnapshots = Object.values(unmatchedSnapshots).some((snapshots) => snapshots.length > 0);
        if (hasBadSnapshots) {
          await lastValueFrom(this.dialogService.confirm({
            title: helptext.clearSnapshotDialog_title,
            message: helptext.clearSnapshotDialog_content,
          })).then(async (dialogResult) => {
            replicationPayload.allow_from_scratch = dialogResult;
            await this.createReplication(replicationPayload).then(
              (createdReplication) => this.createdReplication = createdReplication,
              (err: WebsocketError) => {
                this.toStop = true;
                this.handleError(err);
              },
            );
          });
        } else {
          await this.createReplication(replicationPayload).then(
            (createdReplication) => this.createdReplication = createdReplication,
            (err: WebsocketError) => {
              this.toStop = true;
              this.handleError(err);
            },
          );
        }
      },
      async () => {
        await this.createReplication(replicationPayload).then(
          (createdReplication) => this.createdReplication = createdReplication,
          (err: WebsocketError) => {
            this.toStop = true;
            this.handleError(err);
          },
        );
      },
    );

    if (this.toStop) {
      this.rollBack();
      return;
    }

    this.isLoading = false;
    this.cdr.markForCheck();
    this.slideInService.close();
  }

  private preparePayload(): ReplicationWizardData {
    const steps = this.getSteps();

    const values = steps.map((step) => step.getPayload());
    const payload = _.merge({}, ...values) as ReplicationWizardData;
    payload.source_datasets = payload.source_datasets.map((item) => item.replace(`${mntPath}/`, ''));
    payload.target_dataset = payload.target_dataset.replace(`${mntPath}/`, '');
    return payload;
  }

  getSnapshotsСount(payload: CountManualSnapshotsParams): Promise<EligibleManualSnapshotsCount> {
    return lastValueFrom(this.ws.call('replication.count_eligible_manual_snapshots', [payload]));
  }

  getUnmatchedSnapshots(payload: TargetUnmatchedSnapshotsParams): Promise<{ [dataset: string]: string[] }> {
    return lastValueFrom(this.ws.call('replication.target_unmatched_snapshots', payload));
  }

  createPeriodicSnapshotTask(payload: PeriodicSnapshotTaskCreate): Promise<PeriodicSnapshotTask> {
    return lastValueFrom(this.ws.call('pool.snapshottask.create', [payload]));
  }

  createSnapshot(payload: CreateZfsSnapshot): Promise<ZfsSnapshot> {
    return lastValueFrom(this.ws.call('zfs.snapshot.create', [payload]));
  }

  createReplication(payload: ReplicationCreate): Promise<ReplicationTask> {
    return lastValueFrom(this.ws.call('replication.create', [payload]));
  }

  getSnapshotsCountPayload(value: ReplicationWizardData): CountManualSnapshotsParams {
    let transport = value.transport || TransportMode.Local;
    if (value.ssh_credentials_target) {
      transport = TransportMode.Local;
    }

    const payload: CountManualSnapshotsParams = {
      datasets: value.source_datasets || [],
      transport: value.ssh_credentials_target ? TransportMode.Local : transport,
      ssh_credentials: transport === TransportMode.Local ? null : value.ssh_credentials_source,
    };

    if (value.schema_or_regex === SnapshotNamingOption.NameRegex) {
      payload.name_regex = value.name_regex;
    } else {
      payload.naming_schema = (value.naming_schema || this.defaultNamingSchema).split(' ');
    }

    if (payload.datasets.length > 0) {
      return payload;
    }
    return undefined;
  }

  getPeriodicSnapshotTasksPayload(data: ReplicationWizardData): PeriodicSnapshotTaskCreate[] {
    const payload: PeriodicSnapshotTaskCreate[] = [];
    for (const dataset of data.source_datasets) {
      payload.push({
        dataset,
        recursive: data.recursive,
        schedule: crontabToSchedule(data.schedule_picker),
        lifetime_value: 2,
        lifetime_unit: LifetimeUnit.Week,
        naming_schema: data.naming_schema ? data.naming_schema : this.defaultNamingSchema,
        enabled: true,
      });
    }
    return payload;
  }

  getSnapshotsPayload(data: ReplicationWizardData): CreateZfsSnapshot[] {
    const payload: CreateZfsSnapshot[] = [];
    for (const dataset of data.source_datasets) {
      payload.push({
        dataset,
        naming_schema: data.naming_schema ? data.naming_schema : this.defaultNamingSchema,
        recursive: data.recursive ? data.recursive : false,
      });
    }
    return payload;
  }

  getReplicationPayload(data: ReplicationWizardData): ReplicationCreate {
    let payload = {
      name: data.name,
      direction: data.source_datasets_from === DatasetSource.Remote ? Direction.Pull : Direction.Push,
      source_datasets: data.source_datasets,
      target_dataset: data.target_dataset,
      ssh_credentials: data.ssh_credentials_source || data.ssh_credentials_target,
      transport: data.transport ? data.transport : TransportMode.Local,
      retention_policy: data.retention_policy,
      recursive: data.recursive,
      encryption: data.encryption,
      sudo: data.sudo,
    } as ReplicationCreate;
    if (payload.encryption) {
      payload.encryption_key_format = data.encryption_key_format;
      if (data.encryption_key_format === EncryptionKeyFormat.Passphrase) {
        payload.encryption_key = data.encryption_key_passphrase;
      } else {
        payload.encryption_key = data.encryption_key_generate
          ? this.replicationService.generateEncryptionHexKey(64)
          : data.encryption_key_hex;
      }

      payload.encryption_key_location = data.encryption_key_location_truenasdb
        ? truenasDbKeyLocation
        : data.encryption_key_location;
    }

    if (data.schedule_method === ScheduleMethod.Cron) {
      payload.auto = true;
      if (payload.direction === Direction.Pull) {
        payload.schedule = crontabToSchedule(data.schedule_picker);
        payload = this.setSchemaOrRegexForObject(payload, data.schema_or_regex, data.naming_schema, data.name_regex);
      } else {
        const createdIds = this.createdSnapshotTasks.map((task) => task.id);
        payload.periodic_snapshot_tasks = this.existSnapshotTasks.concat(createdIds);
      }
    } else {
      payload.auto = false;
      if (payload.direction === Direction.Pull) {
        payload = this.setSchemaOrRegexForObject(payload, data.schema_or_regex, data.naming_schema, data.name_regex);
      } else if (data.schema_or_regex === SnapshotNamingOption.NamingSchema) {
        payload.also_include_naming_schema = data.naming_schema ? [data.naming_schema] : [this.defaultNamingSchema];
      } else {
        payload.name_regex = data.name_regex;
      }
    }

    if (data.retention_policy === RetentionPolicy.Custom) {
      payload.lifetime_value = data.lifetime_value;
      payload.lifetime_unit = data.lifetime_unit;
    }

    if (payload.transport === TransportMode.Netcat) {
      payload.netcat_active_side = NetcatMode.Remote; // default?
    }

    payload.readonly = data.schedule_method === ScheduleMethod.Cron || data.readonly
      ? ReadOnlyMode.Set
      : ReadOnlyMode.Ignore;
    return payload;
  }

  isSnapshotTaskExist(payload: {
    dataset: string;
    schedule: Schedule;
    naming_schema?: string;
  }): Promise<PeriodicSnapshotTask[]> {
    return lastValueFrom(
      this.ws.call('pool.snapshottask.query', [[
        ['dataset', '=', payload.dataset],
        ['schedule.minute', '=', payload.schedule.minute],
        ['schedule.hour', '=', payload.schedule.hour],
        ['schedule.dom', '=', payload.schedule.dom],
        ['schedule.month', '=', payload.schedule.month],
        ['schedule.dow', '=', payload.schedule.dow],
        ['naming_schema', '=', payload.naming_schema ? payload.naming_schema : this.defaultNamingSchema],
      ]]),
    );
  }

  setSchemaOrRegexForObject(
    data: ReplicationCreate,
    schemaOrRegex: SnapshotNamingOption,
    schema: string = null,
    regex: string = null,
  ): ReplicationCreate {
    if (schemaOrRegex === SnapshotNamingOption.NamingSchema) {
      data.naming_schema = schema ? [schema] : [this.defaultNamingSchema];
      delete data.name_regex;
    } else {
      data.name_regex = regex;
      delete data.naming_schema;
      delete data.also_include_naming_schema;
    }
    return data;
  }

  handleError(err: WebsocketError): void {
    this.dialogService.error(this.errorHandler.parseWsError(err));
  }
}
