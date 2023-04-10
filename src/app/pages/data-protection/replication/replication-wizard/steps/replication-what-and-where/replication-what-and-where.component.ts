import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { DatasetSource } from 'app/enums/dataset.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import helptext from 'app/helptext/data-protection/replication/replication-wizard';
import { CertificateProfile } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation/forbidden-values-validation';
import { ReplicationService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-what-and-where',
  templateUrl: './replication-what-and-where.component.html',
  styleUrls: ['./replication-what-and-where.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReplicationService, DatePipe],
})
export class ReplicationWhatAndWhereComponent implements OnInit, SummaryProvider {
  @Output() profileSelected = new EventEmitter<CertificateProfile>();

  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider();
  readonly helptext = helptext;
  namesInUse: string[] = [];

  form = this.formBuilder.group({
    exist_replication: [null as number],

    source_datasets_from: [null as DatasetSource, [Validators.required]],
    source: this.formBuilder.group({
      ssh_credentials_source: [null, [Validators.required]],
      source_datasets: [[''], [Validators.required]],
      recursive: [false],
      custom_snapshots: [false],
      schema_or_regex: [SnapshotNamingOption.NamingSchema],
      naming_schema: ['auto-%Y-%m-%d_%H-%M', [Validators.required]],
      name_regex: ['', [Validators.required]],
    }),

    target_dataset_from: [null as DatasetSource, [Validators.required]],
    target: this.formBuilder.group({
      ssh_credentials_target: [null, [Validators.required]],
      target_dataset: [[''], [Validators.required]],
      encryption: [false],
      encryption_key_format: [null as EncryptionKeyFormat, [Validators.required]],
      encryption_key_generate: [true],
      encryption_key_hex: ['', [Validators.required]],
      encryption_key_passphrase: ['', [Validators.required]],
      encryption_key_location_truenasdb: [true],
      encryption_key_location: ['', [Validators.required]],
    }),

    transport: [TransportMode.Ssh, [Validators.required]],
    sudo: [false],
    name: ['', [Validators.required, forbiddenValues(this.namesInUse)]],
  });

  existReplicationOptions$: Observable<Option[]>;
  sshCredentialsSourceOptions$: Observable<Option[]> = of([]);
  sshCredentialsTargetOptions$: Observable<Option[]> = of([]);

  transportOptions$ = of([
    { label: this.translate.instant('Encryption (more secure, but slower)'), value: TransportMode.Ssh },
    { label: this.translate.instant('No Encryption (less secure, but faster)'), value: TransportMode.Netcat },
  ]);

  datasetFromOptions$ = of([
    { label: this.translate.instant('On this System'), value: DatasetSource.Local },
    { label: this.translate.instant('On a Different System'), value: DatasetSource.Remote },
  ]);

  schemaOrRegexOptions$ = of([
    { label: helptext.naming_schema_placeholder, value: SnapshotNamingOption.NamingSchema },
    { label: helptext.name_regex_placeholder, value: SnapshotNamingOption.NameRegex },
  ]);

  encryptionKeyFormatOptions$ = of([
    { label: this.translate.instant('HEX'), value: EncryptionKeyFormat.Hex },
    { label: this.translate.instant('PASSPHRASE'), value: EncryptionKeyFormat.Passphrase },
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private replicationService: ReplicationService,
    private datePipe: DatePipe,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {
    this.ws.call('replication.query').pipe(untilDestroyed(this)).subscribe((replications) => {
      this.namesInUse.push(...replications.map((replication) => replication.name));
    });
  }

  ngOnInit(): void {
    this.form.controls.source.disable();
    this.form.controls.target.disable();
    this.form.controls.source.controls.ssh_credentials_source.disable();
    this.form.controls.source.controls.custom_snapshots.disable();

    this.form.controls.transport.disable();
    this.form.controls.sudo.disable();

    this.setExistReplication();

    this.form.controls.source_datasets_from.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (!value) {
        this.form.controls.source.disable();
        return;
      }
      this.form.controls.source.enable();
      if (value === DatasetSource.Local) {
        this.form.controls.source.controls.ssh_credentials_source.disable();
        this.form.controls.source.controls.custom_snapshots.enable();
      } else {
        this.form.controls.source.controls.ssh_credentials_source.enable();
        this.form.controls.source.controls.custom_snapshots.disable();
      }
    });

    this.form.controls.target_dataset_from.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (!value) {
        this.form.controls.target.disable();
        return;
      }
      this.form.controls.target.enable();
    });
  }

  getSummary(): SummarySection {
    const summary: SummarySection = [];
    return summary;
  }

  getPayload(): ReplicationWhatAndWhereComponent['form']['value'] {
    return this.form.value;
  }

  private setExistReplication(): void {
    this.replicationService.getReplicationTasks().pipe(untilDestroyed(this)).subscribe(
      (tasks: ReplicationTask[]) => {
        const options: Option[] = [];
        for (const task of tasks) {
          if (task.transport !== TransportMode.Legacy) {
            const label = task.name + ' (' + ((task.state && task.state.datetime)
              ? `last run ${this.datePipe.transform(new Date(task.state.datetime.$date), 'MM/dd/yyyy')}`
              : 'never ran')
            + ')';
            options.push({ label, value: task.id });
          }
        }
        this.existReplicationOptions$ = of(options);
        this.cdr.markForCheck();
      },
    );
  }
}
