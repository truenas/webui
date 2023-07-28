import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NavigationExtras, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { CloudSyncTaskUi, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncBucket, CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CreateStorjBucketDialogComponent } from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { CustomTransfersDialogComponent } from 'app/pages/data-protection/cloudsync/custom-transfers-dialog/custom-transfers-dialog.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const newStorjBucket = 'new_storj_bucket';
const customOptionValue = -1;

type FormValue = CloudsyncFormComponent['form']['value'];

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudsyncFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Cloud Sync Task')
      : this.translate.instant('Edit Cloud Sync Task');
  }

  googleDriveProviderId: number;

  form = this.formBuilder.group({
    description: ['' as string, Validators.required],
    direction: [Direction.Pull, Validators.required],
    transfer_mode: [TransferMode.Copy, Validators.required],
    path_destination: [[mntPath], Validators.required],
    path_source: [[mntPath], Validators.required],

    credentials: [null as number, Validators.required],
    bucket: [''],
    bucket_input: ['', Validators.required],
    acknowledge_abuse: [false],
    folder_destination: [[] as string[]],
    folder_source: [[] as string[]],
    bucket_policy_only: [false],

    cloudsync_picker: [CronPresetValue.Daily, Validators.required],
    enabled: [true],

    snapshot: [false],
    create_empty_src_dirs: [false],
    follow_symlinks: [false],
    pre_script: [''],
    post_script: [''],
    exclude: [[] as string[]],
    task_encryption: [''],
    storage_class: [''],
    chunk_size: [96, Validators.min(5)],
    fast_list: [false],
    encryption: [false],
    filename_encryption: [true],
    encryption_password: [''],
    encryption_salt: [''],
    transfers: [4],
    bwlimit: [[] as string[]],
  });

  isLoading = false;
  bucketPlaceholder: string = helptext.bucket_placeholder;
  bucketTooltip: string = helptext.bucket_tooltip;
  bucketInputPlaceholder: string = helptext.bucket_input_placeholder;
  bucketInputTooltip: string = helptext.bucket_input_tooltip;

  readonly transferModeTooltip = `
    ${helptext.transfer_mode_warning_sync}<br><br>
    ${helptext.transfer_mode_warning_copy}<br><br>
    ${helptext.transfer_mode_warning_move}
  `;

  readonly helptext = helptext;

  readonly directionOptions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly transferModeOptions$ = of([
    { label: this.translate.instant('SYNC'), value: TransferMode.Sync },
    { label: this.translate.instant('COPY'), value: TransferMode.Copy },
    { label: this.translate.instant('MOVE'), value: TransferMode.Move },
  ]);

  credentialsList: CloudsyncCredential[] = [];
  readonly credentialsOptions$ = this.cloudCredentialService.getCloudsyncCredentials().pipe(
    map((options) => {
      return options.map((option) => {
        if (option.provider === CloudsyncProviderName.GoogleDrive) {
          this.googleDriveProviderId = option.id;
        }
        return { label: `${option.name} (${option.provider})`, value: option.id };
      });
    }),
    untilDestroyed(this),
  );

  readonly encryptionOptions$ = of([
    { label: 'AES-256', value: 'AES256' },
  ]);

  readonly storageClassOptions$ = of([
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Reduced Redundancy', value: 'REDUCED_REDUNDANCY' },
    { label: 'Standard-IA', value: 'STANDARD_IA' },
    { label: 'One Zone-IA', value: 'ONEZONE_IA' },
    { label: 'Intelligent-Tiering', value: 'INTELLIGENT_TIERING' },
    { label: 'Glacier', value: 'GLACIER' },
    { label: 'Glacier Deep Archive', value: 'DEEP_ARCHIVE' },
  ]);

  transfersDefaultOptions = [
    { label: this.translate.instant('Low Bandwidth (4)'), value: 4 },
    { label: this.translate.instant('Medium Bandwidth (8)'), value: 8 },
    { label: this.translate.instant('High Bandwidth (16)'), value: 16 },
  ];

  transfersCustomOption = { label: this.translate.instant('Custom'), value: customOptionValue };

  transfersOptions$ = of([...this.transfersDefaultOptions, this.transfersCustomOption]);

  bucketOptions$ = of<SelectOption[]>([]);

  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly bucketNodeProvider = this.getBucketsNodeProvider();

  constructor(
    public slideInRef: IxSlideInRef<CloudsyncFormComponent>,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    protected router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    protected dialog: DialogService,
    protected matDialog: MatDialog,
    protected slideInService: IxSlideInService,
    private filesystemService: FilesystemService,
    protected cloudCredentialService: CloudCredentialService,
    @Inject(SLIDE_IN_DATA) private editingTask: CloudSyncTaskUi,
  ) { }

  ngOnInit(): void {
    this.setupForm();

    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  setupForm(): void {
    this.form.controls.path_source.disable();
    this.form.controls.bucket.disable();
    this.form.controls.bucket_input.disable();
    this.form.controls.folder_destination.disable();
    this.form.controls.folder_source.disable();
    this.form.controls.bucket_policy_only.disable();

    this.form.controls.task_encryption.disable();
    this.form.controls.chunk_size.disable();
    this.form.controls.storage_class.disable();
    this.form.controls.fast_list.disable();
    this.form.controls.filename_encryption.disable();
    this.form.controls.encryption_password.disable();
    this.form.controls.encryption_salt.disable();

    this.form.controls.bucket.valueChanges.pipe(untilDestroyed(this)).subscribe((selectedOption) => {
      if (selectedOption !== newStorjBucket) {
        return;
      }
      const dialogRef = this.matDialog.open(CreateStorjBucketDialogComponent, {
        width: '500px',
        data: {
          credentialsId: this.form.controls.credentials.value,
        },
      });
      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((bucket) => {
        if (bucket !== false) {
          this.isLoading = true;
          this.loadBucketOptions();
          this.form.controls.bucket.setValue(bucket);
        } else {
          this.form.controls.bucket.setValue('');
        }
      });
    });
    this.form.controls.direction.valueChanges.pipe(untilDestroyed(this)).subscribe((direction) => {
      if (direction === Direction.Pull || this.form.controls.transfer_mode.value === TransferMode.Move) {
        this.form.controls.snapshot.disable();
      } else {
        this.form.controls.snapshot.enable();
      }
      if (this.form.controls.credentials.value) {
        if (direction === Direction.Pull) {
          this.form.controls.folder_source.enable();
          this.form.controls.folder_destination.disable();
        } else {
          this.form.controls.folder_source.disable();
          this.form.controls.folder_destination.enable();
        }
      }
      if (direction === Direction.Pull) {
        this.form.controls.path_destination.enable();
        this.form.controls.path_source.disable();
      } else {
        this.form.controls.path_destination.disable();
        this.form.controls.path_source.enable();
      }
    });

    this.form.controls.transfer_mode.valueChanges.pipe(untilDestroyed(this)).subscribe((transferMode) => {
      if (transferMode === TransferMode.Move || this.form.controls.direction.value === Direction.Pull) {
        this.form.controls.snapshot.disable();
      } else {
        this.form.controls.snapshot.enable();
      }
    });

    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((encryption) => {
      if (encryption) {
        this.form.controls.filename_encryption.enable();
        this.form.controls.encryption_password.enable();
        this.form.controls.encryption_salt.enable();
      } else {
        this.form.controls.filename_encryption.disable();
        this.form.controls.encryption_password.disable();
        this.form.controls.encryption_salt.disable();
      }
    });

    this.form.controls.credentials.valueChanges.pipe(untilDestroyed(this)).subscribe((credentials) => {
      if (credentials) {
        if (this.form.controls.direction.value === Direction.Pull) {
          this.form.controls.folder_source.enable();
          this.form.controls.folder_destination.disable();
        } else {
          this.form.controls.folder_source.disable();
          this.form.controls.folder_destination.enable();
        }

        this.cloudCredentialService.getCloudsyncCredentials()
          .pipe(
            switchMap((credentialsList) => {
              this.credentialsList = credentialsList;
              return this.cloudCredentialService.getProviders();
            }),
            map((providersList) => {
              const targetCredentials = _.find(this.credentialsList, { id: credentials });
              const targetProvider = _.find(providersList, { name: targetCredentials?.provider });
              if (targetProvider && targetProvider.buckets) {
                this.isLoading = true;
                if (targetCredentials.provider === CloudsyncProviderName.MicrosoftAzure
                  || targetCredentials.provider === CloudsyncProviderName.Hubic
                ) {
                  this.bucketPlaceholder = this.translate.instant('Container');
                  this.bucketTooltip = this.translate.instant('Select the pre-defined container to use.');
                  this.bucketInputPlaceholder = this.translate.instant('Container');
                  this.bucketInputTooltip = this.translate.instant('Input the pre-defined container to use.');
                } else {
                  this.bucketPlaceholder = helptext.bucket_placeholder;
                  this.bucketTooltip = helptext.bucket_tooltip;
                  this.bucketInputPlaceholder = helptext.bucket_input_placeholder;
                  this.bucketInputTooltip = helptext.bucket_input_tooltip;
                }

                this.loadBucketOptions();

                this.cdr.markForCheck();
              } else {
                this.form.controls.bucket.disable();
                this.form.controls.bucket_input.disable();
              }

              if (targetProvider && targetProvider.name === CloudsyncProviderName.GoogleCloudStorage) {
                this.form.controls.bucket_policy_only.enable();
              } else {
                this.form.controls.bucket_policy_only.disable();
              }

              const schemaFound = _.find(providersList, { name: targetCredentials?.provider });
              const taskSchema = schemaFound ? schemaFound.task_schema : [];

              const taskSchemas = ['task_encryption', 'fast_list', 'chunk_size', 'storage_class'];
              for (const i of taskSchemas) {
                const tobeDisable = !(_.findIndex(taskSchema, { property: i }) > -1);
                if (i === 'task_encryption' || i === 'fast_list' || i === 'chunk_size' || i === 'storage_class') {
                  if (tobeDisable) {
                    this.form.controls[i].disable();
                  } else {
                    this.form.controls[i].enable();
                  }
                }
              }
            }),
            untilDestroyed(this),
          )
          .subscribe();
      } else {
        this.form.controls.bucket.disable();
        this.form.controls.bucket_input.disable();
        this.form.controls.bucket_policy_only.disable();
        this.form.controls.folder_source.disable();
        this.form.controls.folder_destination.disable();

        this.form.controls.task_encryption.disable();
        this.form.controls.fast_list.disable();
        this.form.controls.chunk_size.disable();
        this.form.controls.storage_class.disable();
      }
    });

    this.form.controls.path_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      if (!values) {
        return;
      }
      const paths = Array.isArray(values) ? values : [values];
      if (!paths.length) {
        return;
      }

      const parentDirectories = paths.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        return sliced.join('/');
      });
      const allMatch = parentDirectories.every((directory: string) => directory === parentDirectories[0]);

      const pathSourceControl = this.form.controls.path_source;
      let prevErrors = pathSourceControl.errors;
      if (prevErrors === null) {
        prevErrors = {};
      }
      if (!allMatch) {
        pathSourceControl.setErrors({
          ...prevErrors,
          misMatchDirectories: {
            message: this.translate.instant('All selected directories must be at the same level i.e., must have the same parent directory.'),
          },
        });
      } else {
        delete prevErrors.misMatchDirectories;
        if (Object.keys(prevErrors).length) {
          pathSourceControl.setErrors({ ...prevErrors });
        } else {
          pathSourceControl.setErrors(null);
        }
      }
    });

    this.form.controls.folder_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      if (!values) {
        return;
      }
      const sources = Array.isArray(values) ? values : [values];
      if (!sources.length) {
        return;
      }
      const parentDirectories = sources.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        return sliced.join('/');
      });
      const allMatch = parentDirectories.every((directory: string) => directory === parentDirectories[0]);

      const folderSourceControl = this.form.controls.folder_source;
      let prevErrors = folderSourceControl.errors;
      if (prevErrors === null) {
        prevErrors = {};
      }
      if (!allMatch) {
        folderSourceControl.setErrors({
          ...prevErrors,
          misMatchDirectories: {
            message: this.translate.instant('All selected directories must be at the same level i.e., must have the same parent directory.'),
          },
        });
      } else {
        delete prevErrors.misMatchDirectories;
        if (Object.keys(prevErrors).length) {
          folderSourceControl.setErrors({ ...prevErrors });
        } else {
          folderSourceControl.setErrors(null);
        }
      }
    });

    this.form.controls.transfers.valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      if (value === customOptionValue) {
        const dialogRef = this.matDialog.open(CustomTransfersDialogComponent);
        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((transfers: number) => {
          if (this.isCustomTransfers(transfers)) {
            this.setTransfersOptions(true, transfers);
          }
          this.form.controls.transfers.setValue(transfers || null);
        });
      } else if (!this.isCustomTransfers(value)) {
        this.setTransfersOptions(false, value);
      }
    });
  }

  loadBucketOptions(): void {
    const targetCredentials = _.find(this.credentialsList, { id: this.form.controls.credentials.value });

    this.getBuckets(targetCredentials.id).pipe(untilDestroyed(this)).subscribe({
      next: (buckets) => {
        const bucketOptions = buckets.map((bucket) => ({
          label: bucket.Name,
          value: bucket.Path,
          disabled: !bucket.Enabled,
        }));
        if (targetCredentials.provider === CloudsyncProviderName.Storj) {
          bucketOptions.unshift({
            label: this.translate.instant('Add new'),
            value: newStorjBucket,
            disabled: false,
          });
        }
        this.bucketOptions$ = of(bucketOptions);
        this.isLoading = false;
        this.form.controls.bucket.enable();
        this.form.controls.bucket_input.disable();
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isLoading = false;
        this.form.controls.bucket.disable();
        this.form.controls.bucket_input.enable();
        this.dialog.closeAllDialogs();
        this.dialog.confirm({
          title: error.extra ? (error.extra as { excerpt: string }).excerpt : `${this.translate.instant('Error: ')}${error.error}`,
          message: error.reason,
          hideCheckbox: true,
          buttonText: this.translate.instant('Fix Credential'),
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          const navigationExtras: NavigationExtras = { state: { editCredential: 'cloudcredentials', id: targetCredentials.id } };
          this.router.navigate(['/', 'credentials', 'backup-credentials'], navigationExtras);
        });
        this.cdr.markForCheck();
      },
    });
  }

  getBuckets(credentialId: number): Observable<CloudsyncBucket[]> {
    return this.ws.call('cloudsync.list_buckets', [credentialId]);
  }

  getBucketsNodeProvider(): TreeNodeProvider {
    return () => {
      let bucket = '';
      if (this.form.controls.bucket.enabled) {
        bucket = this.form.controls.bucket.value;
      } else if (this.form.controls.bucket_input.enabled) {
        bucket = this.form.controls.bucket_input.value;
      }

      const data = {
        credentials: this.form.controls.credentials.value,
        encryption: !!this.form.controls.encryption.value,
        filename_encryption: !!this.form.controls.filename_encryption.value,
        encryption_password: this.form.controls.encryption_password.value,
        encryption_salt: this.form.controls.encryption_salt.value,
        attributes: {
          bucket,
          folder: '/',
        },
        args: '',
      };

      if (bucket === '') {
        delete data.attributes.bucket;
      }

      return this.ws.call('cloudsync.list_directory', [data]).pipe(
        map((listing) => {
          const nodes: ExplorerNodeData[] = [];
          listing.forEach((file) => {
            if (file.IsDir) {
              nodes.push({
                path: '/' + file.Name,
                name: file.Name,
                type: ExplorerNodeType.Directory,
                hasChildren: false,
              });
            }
          });
          return nodes;
        }),
      );
    };
  }

  isCustomTransfers(transfers: number): boolean {
    const transfersDefaultValues = this.transfersDefaultOptions.map((option) => option.value);
    return transfers && !transfersDefaultValues.includes(transfers);
  }

  setTransfersOptions(isCustomTransfersSelected: boolean, customTransfers?: number): void {
    if (isCustomTransfersSelected) {
      const customOption = { label: this.translate.instant('Custom ({customTransfers})', { customTransfers }), value: customTransfers };
      this.transfersOptions$ = of([...this.transfersDefaultOptions, customOption, this.transfersCustomOption]);
    } else {
      this.transfersOptions$ = of([...this.transfersDefaultOptions, this.transfersCustomOption]);
    }
  }

  setTaskForEdit(): void {
    const transfers = this.editingTask.transfers;
    if (this.isCustomTransfers(transfers)) {
      this.setTransfersOptions(true, transfers);
    }

    this.form.patchValue({
      ...this.editingTask,
      cloudsync_picker: scheduleToCrontab(this.editingTask.schedule) as CronPresetValue,
      credentials: this.editingTask.credentials.id,
      encryption: this.editingTask.encryption,
      bwlimit: this.editingTask.bwlimit.map((bwlimit) => {
        return bwlimit.bandwidth
          ? `${bwlimit.time}, ${filesize(bwlimit.bandwidth, { standard: 'iec' })}`
          : `${bwlimit.time}, off`;
      }),
    });

    if (this.editingTask.direction === Direction.Pull) {
      this.form.controls.path_destination.setValue([this.editingTask.path]);

      if (this.editingTask.include?.length) {
        this.form.controls.folder_source.setValue(
          this.editingTask.include.map((path: string) => (`${this.editingTask.attributes.folder as string}/${path.split('/')[1]}`)),
        );
      } else {
        this.form.controls.folder_source.setValue([this.editingTask.attributes.folder as string]);
      }
    } else {
      this.form.controls.folder_destination.setValue([this.editingTask.attributes.folder as string]);

      if (this.editingTask.include?.length) {
        this.form.controls.path_source.setValue(
          this.editingTask.include.map((path: string) => (`${this.editingTask.path}/${path.split('/')[1]}`)),
        );
      } else {
        this.form.controls.path_source.setValue([this.editingTask.path]);
      }
    }

    if (this.editingTask.attributes.bucket) {
      this.form.controls.bucket.setValue(this.editingTask.attributes.bucket as string);
      this.form.controls.bucket_input.setValue(this.editingTask.attributes.bucket as string);
    }
    if (this.editingTask.attributes.bucket_policy_only) {
      this.form.controls.bucket_policy_only.setValue(this.editingTask.attributes.bucket_policy_only as boolean);
    }
    if (this.editingTask.attributes.task_encryption) {
      this.form.controls.task_encryption.setValue(this.editingTask.attributes.task_encryption as string);
    }
    if (this.editingTask.attributes.fast_list) {
      this.form.controls.fast_list.setValue(this.editingTask.attributes.fast_list as boolean);
    }
    if (this.editingTask.attributes.chunk_size) {
      this.form.controls.chunk_size.setValue(this.editingTask.attributes.chunk_size as number);
    }
    if (this.editingTask.attributes.acknowledge_abuse) {
      this.form.controls.acknowledge_abuse.setValue(this.editingTask.attributes.acknowledge_abuse as boolean);
    }
    if (this.editingTask.attributes.storage_class) {
      this.form.controls.storage_class.setValue(this.editingTask.attributes.storage_class as string);
    }
  }

  prepareBwlimit(bwlimit: string[]): CloudSyncTaskUpdate['bwlimit'] {
    const bwlimtArr = [];

    for (const limit of bwlimit) {
      const sublimitArr = limit.split(/\s*,\s*/);
      if (sublimitArr.length === 1 && bwlimit.length === 1 && !sublimitArr[0].includes(':')) {
        sublimitArr.unshift('00:00');
      }
      if (sublimitArr[1] && sublimitArr[1] !== 'off') {
        if (sublimitArr[1].endsWith('/s') || sublimitArr[1].endsWith('/S')) {
          sublimitArr[1] = sublimitArr[1].substring(0, sublimitArr[1].length - 2);
        }
        if (this.cloudCredentialService.getByte(sublimitArr[1]) !== -1) {
          (sublimitArr[1] as number | string) = this.cloudCredentialService.getByte(sublimitArr[1]);
        }
      }
      const subLimit = {
        time: sublimitArr[0],
        bandwidth: sublimitArr[1] === 'off' ? null : sublimitArr[1],
      };

      bwlimtArr.push(subLimit);
    }
    return bwlimtArr;
  }

  prepareData(formValue: FormValue): CloudSyncTaskUpdate {
    const attributes: CloudSyncTaskUpdate['attributes'] = {};

    const value: CloudSyncTaskUpdate = {
      ...formValue,
      attributes,
      include: undefined,
      path: undefined,
      bwlimit: formValue.bwlimit ? this.prepareBwlimit(formValue.bwlimit) : undefined,
      schedule: formValue.cloudsync_picker ? crontabToSchedule(formValue.cloudsync_picker) : {},
      snapshot: formValue.direction === Direction.Pull ? false : formValue.snapshot,
    };

    const attributesToFill = [
      'bucket', 'bucket_input', 'bucket_policy_only', 'task_encryption',
      'storage_class', 'fast_list', 'chunk_size', 'acknowledge_abuse',
    ] as const;

    ([
      'path_source', 'path_destination', 'folder_source',
      'folder_destination', 'cloudsync_picker', ...attributesToFill,
    ] as const).forEach((key) => {
      delete (value as unknown as FormValue)[key];
    });

    if (formValue.direction === Direction.Pull) {
      value.path = _.isArray(formValue.path_destination) ? formValue.path_destination[0] : formValue.path_destination;

      if (!formValue.folder_source.length || !_.isArray(formValue.folder_source)) {
        attributes.folder = '/';
      } else if (formValue.folder_source.length === 1) {
        attributes.folder = formValue.folder_source[0];
      } else {
        value.include = [];
        for (const dir of formValue.folder_source) {
          const directory = dir.split('/');
          value.include.push('/' + directory[directory.length - 1] + '/**');
        }
        const directory = formValue.folder_source[formValue.folder_source.length - 1].split('/');
        attributes.folder = directory.slice(0, directory.length - 1).join('/');
      }
    } else {
      attributes.folder = _.isArray(formValue.folder_destination)
        ? formValue.folder_destination[0] : formValue.folder_destination;

      if (!formValue.path_source.length || !_.isArray(formValue.path_source)) {
        value.path = '/';
      } else if (formValue.path_source.length === 1) {
        value.path = formValue.path_source[0];
      } else {
        value.include = [];
        for (const dir of formValue.path_source) {
          const directory = dir.split('/');
          value.include.push('/' + directory[directory.length - 1] + '/**');
        }
        const directory = formValue.path_source[formValue.path_source.length - 1].split('/');
        value.path = directory.slice(0, directory.length - 1).join('/');
      }
    }

    attributesToFill.forEach((name) => {
      if (name === 'acknowledge_abuse' && this.form.controls.credentials.value !== this.googleDriveProviderId) {
        return;
      }

      if (formValue[name] !== undefined && formValue[name] !== null && formValue[name] !== '') {
        if (name === 'task_encryption') {
          attributes[name] = formValue[name] === '' ? null : formValue[name];
        } else {
          attributes[name] = formValue[name];
        }
      }
    });

    value.attributes = attributes;

    return value;
  }

  onDryRun(): void {
    const payload = this.prepareData(this.form.value);
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.job_dialog_title_dry_run },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('cloudsync.sync_onetime', [payload, { dry_run: true }]);
    dialogRef.componentInstance.showAbortButton = true;
    dialogRef.componentInstance.showRealtimeLogs = true;
    dialogRef.componentInstance.hideProgressValue = true;
    dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.componentInstance.showCloseButton = true;
    });
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.aborted.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.componentInstance.showCloseButton = true;
    });
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.componentInstance.showCloseButton = true;
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.matDialog.closeAll();
      this.errorHandler.handleWsFormError(err, this.form);
    });
  }

  onSubmit(): void {
    const payload = this.prepareData(this.form.value);

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('cloudsync.create', [payload]);
    } else {
      request$ = this.ws.call('cloudsync.update', [this.editingTask.id, payload]);
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
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
