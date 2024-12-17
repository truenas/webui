import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, viewChild,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatStepper, MatStep, MatStepLabel } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { merge } from 'lodash-es';
import {
  catchError, EMPTY, forkJoin, map, Observable, of, switchMap, tap,
} from 'rxjs';
import { truenasDbKeyLocation } from 'app/constants/truenas-db-key-location.constant';
import { DatasetSource } from 'app/enums/dataset.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { Role } from 'app/enums/role.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { helptextReplicationWizard } from 'app/helptext/data-protection/replication/replication-wizard';
import { CountManualSnapshotsParams, EligibleManualSnapshotsCount, TargetUnmatchedSnapshotsParams } from 'app/interfaces/count-manual-snapshots.interface';
import { PeriodicSnapshotTask, PeriodicSnapshotTaskCreate } from 'app/interfaces/periodic-snapshot-task.interface';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { CreateZfsSnapshot, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ReplicationWizardData } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard-data.interface';
import { ReplicationWhatAndWhereComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-what-and-where/replication-what-and-where.component';
import { ReplicationWhenComponent } from 'app/pages/data-protection/replication/replication-wizard/steps/replication-when/replication-when.component';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ReplicationService } from 'app/services/replication.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-wizard',
  templateUrl: './replication-wizard.component.html',
  styleUrls: ['./replication-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReplicationService],
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    MatStepper,
    MatStep,
    MatStepLabel,
    ReplicationWhatAndWhereComponent,
    ReplicationWhenComponent,
    TranslateModule,
    UseIxIconsInStepperComponent,
  ],
})
export class ReplicationWizardComponent {
  protected whatAndWhere = viewChild(ReplicationWhatAndWhereComponent);
  protected when = viewChild(ReplicationWhenComponent);

  protected readonly requiredRoles = [Role.ReplicationTaskWrite, Role.ReplicationTaskWritePull];

  isLoading = false;
  defaultNamingSchema = 'auto-%Y-%m-%d_%H-%M';
  isCustomRetentionVisible = true;

  eligibleSnapshots = 0;
  existSnapshotTasks: number[] = [];
  createdSnapshots: ZfsSnapshot[] = [];
  createdSnapshotTasks: PeriodicSnapshotTask[] = [];
  createdReplication: ReplicationTask;

  constructor(
    private api: ApiService,
    private replicationService: ReplicationService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private appLoader: AppLoaderService,
    private snackbar: SnackbarService,
    private chainedSlideInRef: ChainedRef<unknown>,
    private authService: AuthService,
  ) {
    this.chainedSlideInRef.requireConfirmationWhen(() => {
      return of(this.whatAndWhere().form.dirty || this.when().form.dirty);
    });
  }

  getSteps(): [
    ReplicationWhatAndWhereComponent,
    ReplicationWhenComponent,
  ] {
    return [this.whatAndWhere(), this.when()];
  }

  rollBack(): void {
    const requests: Observable<unknown>[] = [];

    this.createdSnapshots.forEach((snapshot) => {
      requests.push(this.api.call('zfs.snapshot.delete', [snapshot.name]));
    });

    this.createdSnapshotTasks.forEach((task) => {
      requests.push(this.api.call('pool.snapshottask.delete', [task.id]));
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

  onSubmit(): void {
    this.isLoading = true;

    this.createdSnapshots = [];
    this.createdSnapshotTasks = [];
    this.createdReplication = undefined;

    const values = this.preparePayload();

    this.callCreateSnapshots(values).pipe(
      switchMap(() => this.callCreateTasks(values)),
      switchMap(() => this.callCreateReplication(values)),
      tap((createdReplication) => {
        this.snackbar.success(this.translate.instant('Replication task created.'));
        this.isLoading = false;
        this.createdReplication = createdReplication;
      }),
      switchMap((createdReplication) => {
        if (values.schedule_method === ScheduleMethod.Once && createdReplication) {
          return this.runReplicationOnce(createdReplication).pipe(
            catchError((err: unknown) => {
              this.handleError(err);
              return EMPTY;
            }),
            switchMap(() => of(createdReplication)),
          );
        }
        return of(createdReplication);
      }),
      untilDestroyed(this),
    ).subscribe((createdReplication) => {
      this.cdr.markForCheck();
      this.chainedSlideInRef.close({ response: createdReplication, error: null });
    });
  }

  private runReplicationOnce(createdReplication: ReplicationTask): Observable<boolean> {
    this.appLoader.open(this.translate.instant('Starting task'));
    return this.api.startJob('replication.run', [createdReplication.id]).pipe(
      switchMap(() => {
        this.appLoader.close();
        return this.dialogService.info(
          this.translate.instant('Task started'),
          this.translate.instant('Replication <i>{name}</i> has started.', { name: createdReplication.name }),
          true,
        );
      }),
    );
  }

  private preparePayload(): ReplicationWizardData {
    const steps = this.getSteps();

    const values = steps.map((step) => step.getPayload());
    const payload = merge({}, ...values) as ReplicationWizardData;
    payload.source_datasets = payload.source_datasets.map((item) => item.replace(`${mntPath}/`, ''));
    payload.target_dataset = payload.target_dataset.replace(`${mntPath}/`, '');
    return payload;
  }

  getSnapshotsCount(payload: CountManualSnapshotsParams): Observable<EligibleManualSnapshotsCount> {
    return this.authService.hasRole([
      Role.ReplicationTaskWrite,
      Role.ReplicationTaskWritePull,
    ]).pipe(
      switchMap((hasRole) => {
        if (hasRole) {
          return this.api.call('replication.count_eligible_manual_snapshots', [payload]);
        }
        return of({ eligible: 0, total: 0 });
      }),
    );
  }

  getUnmatchedSnapshots(payload: TargetUnmatchedSnapshotsParams): Observable<Record<string, string[]>> {
    return this.api.call('replication.target_unmatched_snapshots', payload);
  }

  createPeriodicSnapshotTask(payload: PeriodicSnapshotTaskCreate): Observable<PeriodicSnapshotTask> {
    return this.api.call('pool.snapshottask.create', [payload]);
  }

  createSnapshot(payload: CreateZfsSnapshot): Observable<ZfsSnapshot> {
    return this.api.call('zfs.snapshot.create', [payload]);
  }

  createReplication(payload: ReplicationCreate): Observable<ReplicationTask> {
    return this.api.call('replication.create', [payload]);
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

      payload.encryption_inherit = data.encryption_inherit;
    }

    if (data.schedule_method === ScheduleMethod.Cron) {
      payload.auto = true;
      if (payload.direction === Direction.Pull) {
        payload.schedule = crontabToSchedule(data.schedule_picker);
        payload = this.setSchemaOrRegexForObject(payload, data.schema_or_regex, data.naming_schema, data.name_regex);
      } else {
        const createdIds = this.createdSnapshotTasks.map((task) => task.id);
        payload.periodic_snapshot_tasks = this.existSnapshotTasks.concat(createdIds);

        if (data.custom_snapshots) {
          payload = this.setSchemaOrRegexForObject(payload, data.schema_or_regex, data.naming_schema, data.name_regex);
        }
      }
    } else {
      payload.auto = false;
      if (payload.direction === Direction.Pull) {
        payload = this.setSchemaOrRegexForObject(payload, data.schema_or_regex, data.naming_schema, data.name_regex);
      } else if (data.schema_or_regex === SnapshotNamingOption.NamingSchema) {
        payload.also_include_naming_schema = data.naming_schema ? [data.naming_schema] : [this.defaultNamingSchema];
      } else if (data.name_regex) {
        payload.name_regex = data.name_regex;
      } else {
        // fallback when no other data to rely on
        payload.also_include_naming_schema = [this.defaultNamingSchema];
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
  }): Observable<PeriodicSnapshotTask[]> {
    return this.api.call('pool.snapshottask.query', [[
      ['dataset', '=', payload.dataset],
      ['schedule.minute', '=', payload.schedule.minute],
      ['schedule.hour', '=', payload.schedule.hour],
      ['schedule.dom', '=', payload.schedule.dom],
      ['schedule.month', '=', payload.schedule.month],
      ['schedule.dow', '=', payload.schedule.dow],
      ['naming_schema', '=', payload.naming_schema ? payload.naming_schema : this.defaultNamingSchema],
    ]]);
  }

  setSchemaOrRegexForObject(
    data: ReplicationCreate,
    schemaOrRegex: SnapshotNamingOption,
    schema: string = null,
    regex: string = null,
  ): ReplicationCreate {
    const values = { ...data };
    if (schemaOrRegex === SnapshotNamingOption.NamingSchema) {
      values.naming_schema = schema ? [schema] : [this.defaultNamingSchema];
      delete values.name_regex;
    } else {
      values.name_regex = regex;
      delete values.naming_schema;
      delete values.also_include_naming_schema;
    }
    return values;
  }

  handleError(err: unknown): void {
    this.dialogService.error(this.errorHandler.parseError(err));
    this.rollBack();
  }

  callCreateSnapshots(values: ReplicationWizardData): Observable<ZfsSnapshot[]> {
    const snapshotsCountPayload = this.getSnapshotsCountPayload(values);
    if (snapshotsCountPayload) {
      return this.getSnapshotsCount(snapshotsCountPayload).pipe(
        switchMap((snapshotCount) => {
          this.eligibleSnapshots = snapshotCount.eligible;
          const requestsSnapshots = [];
          if (this.eligibleSnapshots === 0 && values.source_datasets_from === DatasetSource.Local) {
            for (const payload of this.getSnapshotsPayload(values)) {
              requestsSnapshots.push(this.createSnapshot(payload));
            }
          }
          return requestsSnapshots.length ? forkJoin(requestsSnapshots) : of(null);
        }),
        map((createdSnapshots) => this.createdSnapshots = (createdSnapshots || []).filter((snapshot) => !!snapshot)),
      );
    }
    return of(null);
  }

  callCreateTasks(values: ReplicationWizardData): Observable<PeriodicSnapshotTask[]> {
    if (values.schedule_method === ScheduleMethod.Cron && values.source_datasets_from === DatasetSource.Local) {
      this.existSnapshotTasks = [];
      const requestsTasks = [];
      for (const payload of this.getPeriodicSnapshotTasksPayload(values)) {
        requestsTasks.push(
          this.isSnapshotTaskExist(payload).pipe(
            switchMap((tasks) => {
              if (tasks.length === 0) {
                return this.createPeriodicSnapshotTask(payload);
              }
              this.existSnapshotTasks.push(...tasks.map((task) => task.id));
              return of(null);
            }),
          ),
        );
      }
      if (requestsTasks.length) {
        return forkJoin(requestsTasks).pipe(
          map((createdSnapshotTasks) => {
            this.createdSnapshotTasks = (createdSnapshotTasks || []).filter((task) => !!task);
            return this.createdSnapshotTasks;
          }),
        );
      }
    }
    return of(null);
  }

  callCreateReplication(values: ReplicationWizardData): Observable<ReplicationTask> {
    const replicationPayload = this.getReplicationPayload(values);
    return this.getUnmatchedSnapshots([
      replicationPayload.direction,
      replicationPayload.source_datasets,
      replicationPayload.target_dataset,
      replicationPayload.transport,
      replicationPayload.ssh_credentials,
    ]).pipe(
      catchError(() => {
        return this.createReplication(replicationPayload);
      }),
      switchMap((unmatchedSnapshots) => {
        const hasBadSnapshots = Object.values(unmatchedSnapshots)
          .some((snapshots: string[]) => snapshots.length > 0);
        if (hasBadSnapshots) {
          return this.dialogService.confirm({
            title: helptextReplicationWizard.clearSnapshotDialog_title,
            message: helptextReplicationWizard.clearSnapshotDialog_content,
          }).pipe(
            switchMap((dialogResult) => {
              replicationPayload.allow_from_scratch = dialogResult;
              return this.createReplication(replicationPayload);
            }),
          );
        }
        return this.createReplication(replicationPayload);
      }),

    );
  }
}
