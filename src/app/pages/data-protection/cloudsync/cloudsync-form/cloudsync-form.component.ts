import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
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
import { filter, map } from 'rxjs/operators';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { CloudSyncTaskUi, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncBucket } from 'app/interfaces/cloudsync-credential.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { CloudCredentialService, DialogService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudsyncFormComponent {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Cloud Sync Task')
      : this.translate.instant('Edit Cloud Sync Task');
  }

  form = this.formBuilder.group({
    description: ['' as string, Validators.required],
    direction: [Direction.Pull, Validators.required],
    transfer_mode: [TransferMode.Copy, Validators.required],
    path_destination: [['/mnt'], Validators.required],
    path_source: [['/mnt'], Validators.required],

    credentials: [null as number, Validators.required],
    bucket: [''],
    bucket_input: ['', Validators.required],
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
    transfers: [null as number],
    bwlimit: [[] as string[]],
  });

  isLoading = false;
  bucketPlaceholder = helptext.bucket_placeholder;
  bucketTooltip = helptext.bucket_tooltip;
  bucketInputPlaceholder = helptext.bucket_input_placeholder;
  bucketInputTooltip = helptext.bucket_input_tooltip;

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

  readonly credentialsOptions$ = this.cloudCredentialService.getCloudsyncCredentials().pipe(
    map((options) => {
      return options.map((option) => (
        { label: `${option.name} (${option.provider})`, value: option.id }
      ));
    }),
    untilDestroyed(this),
  );

  readonly bucketOptions$ = this.form.controls.credentials.value
    ? this.getBuckets(this.form.controls.credentials.value).pipe(
      map((options) => {
        return options.map((subitem) => ({ label: subitem.Name, value: subitem.Path }));
      }),
    ) : of([]);

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

  readonly fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly bucketNodeProvider = this.getBucketsNodeProvider();

  private editingTask: CloudSyncTaskUi;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    protected router: Router,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    protected dialog: DialogService,
    protected matDialog: MatDialog,
    protected slideInService: IxSlideInService,
    private filesystemService: FilesystemService,
    protected cloudCredentialService: CloudCredentialService,
  ) {
    this.setupForm();
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
      if (this.form.controls.transfer_mode.value !== TransferMode.Copy) {
        this.dialog.info(helptext.resetTransferModeDialog.title, helptext.resetTransferModeDialog.content, true);
        this.form.controls.transfer_mode.setValue(TransferMode.Copy);
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
          .pipe(untilDestroyed(this)).subscribe((credentialsList) => {
            this.cloudCredentialService.getProviders().pipe(untilDestroyed(this)).subscribe((providersList) => {
              const targetCredentials = _.find(credentialsList, { id: credentials });
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

                this.getBuckets(targetCredentials.id).pipe(untilDestroyed(this)).subscribe({
                  next: () => {
                    this.isLoading = false;
                    this.form.controls.bucket.enable();
                    this.form.controls.bucket_input.disable();
                  },
                  error: (err) => {
                    this.isLoading = false;
                    this.form.controls.bucket.disable();
                    this.form.controls.bucket_input.enable();
                    this.dialog.closeAllDialogs();
                    this.dialog.confirm({
                      title: err.extra ? err.extra.excerpt : (this.translate.instant('Error: ') + err.error),
                      message: err.reason,
                      hideCheckBox: true,
                      buttonMsg: this.translate.instant('Fix Credential'),
                    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
                      const navigationExtras: NavigationExtras = { state: { editCredential: 'cloudcredentials', id: targetCredentials.id } };
                      this.router.navigate(['/', 'credentials', 'backup-credentials'], navigationExtras);
                    });
                  },
                });
              } else {
                this.form.controls.bucket.disable();
                this.form.controls.bucket_input.disable();
              }

              if (targetProvider && targetProvider.name === CloudsyncProviderName.GoogleCloudStorage) {
                this.form.controls.bucket_policy_only.enable();
              } else {
                this.form.controls.bucket_policy_only.disable();
              }

              const taskSchema = _.find(providersList, { name: targetCredentials?.provider })
                ? _.find(providersList, { name: targetCredentials?.provider }).task_schema : [];

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
            });
          });
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
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (!values.length) {
        return;
      }

      const parentDirectories = values.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        const joined = sliced.join('/');
        return joined;
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
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (!values.length) {
        return;
      }
      const parentDirectories = values.map((value: string) => {
        const split = value.split('/');
        const sliced = split.slice(0, split.length - 1);
        const joined = sliced.join('/');
        return joined;
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

  setTaskForEdit(task: CloudSyncTaskUi): void {
    this.editingTask = task;

    this.form.patchValue({
      ...task,
      cloudsync_picker: scheduleToCrontab(task.schedule) as CronPresetValue,
      credentials: task.credentials.id,
      encryption: task.encryption,
      bwlimit: task.bwlimit.map((bwlimit) => {
        return bwlimit.bandwidth
          ? `${bwlimit.time}, ${filesize(bwlimit.bandwidth)}`
          : `${bwlimit.time}, off`;
      }),
    });

    if (task.direction === Direction.Pull) {
      this.form.controls.path_destination.setValue([task.path]);

      if (task.include?.length) {
        this.form.controls.folder_source.setValue(
          task.include.map((path: string) => (`${task.attributes.folder as string}/${path.split('/')[1]}`)),
        );
      } else {
        this.form.controls.folder_source.setValue([task.attributes.folder as string]);
      }
    } else {
      this.form.controls.folder_destination.setValue([task.attributes.folder as string]);

      if (task.include?.length) {
        this.form.controls.path_source.setValue(
          task.include.map((path: string) => (`${task.path}/${path.split('/')[1]}`)),
        );
      } else {
        this.form.controls.path_source.setValue([task.path]);
      }
    }

    if (task.attributes.bucket) {
      this.form.controls.bucket.setValue(task.attributes.bucket as string);
      this.form.controls.bucket_input.setValue(task.attributes.bucket as string);
    }
    if (task.attributes.bucket_policy_only) {
      this.form.controls.bucket_policy_only.setValue(task.attributes.bucket_policy_only as boolean);
    }
    if (task.attributes.task_encryption) {
      this.form.controls.task_encryption.setValue(task.attributes.task_encryption as string);
    }
    if (task.attributes.fast_list) {
      this.form.controls.fast_list.setValue(task.attributes.fast_list as boolean);
    }
    if (task.attributes.chunk_size) {
      this.form.controls.chunk_size.setValue(task.attributes.chunk_size as number);
    }
    if (task.attributes.storage_class) {
      this.form.controls.storage_class.setValue(task.attributes.storage_class as string);
    }
  }

  prepareBwlimit(bwlimit: string): { time: string; bandwidth: string }[] {
    const bwlimtArr = [];

    for (const limit of bwlimit) {
      const sublimitArr = limit.split(/\s*,\s*/);
      if (sublimitArr.length === 1 && bwlimit.length === 1) {
        if (!sublimitArr[0].includes(':')) {
          sublimitArr.unshift('00:00');
        }
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

  prepareData(formValue: any): CloudSyncTaskUpdate {
    const value = _.cloneDeep(formValue);
    const attributes: CloudSyncTaskUpdate['attributes'] = {};

    if (value.direction === Direction.Pull) {
      value.path = _.isArray(value.path_destination) ? value.path_destination[0] : value.path_destination;

      if (!value.folder_source.length || !_.isArray(value.folder_source)) {
        attributes.folder = '/';
      } else if (value.folder_source.length === 1) {
        attributes.folder = value.folder_source[0];
      } else {
        value.include = [];
        for (const dir of value.folder_source) {
          const directory = dir.split('/');
          value.include.push('/' + directory[directory.length - 1] + '/**');
        }
        const directory = value.folder_source[value.folder_source.length - 1].split('/');
        attributes.folder = directory.slice(0, directory.length - 1).join('/');
      }
    } else {
      attributes.folder = _.isArray(value.folder_destination) ? value.folder_destination[0] : value.folder_destination;

      if (!value.path_source.length || !_.isArray(value.path_source)) {
        value.path = '/';
      } else if (value.path_source.length === 1) {
        value.path = value.path_source[0];
      } else {
        value.include = [];
        for (const dir of value.path_source) {
          const directory = dir.split('/');
          value.include.push('/' + directory[directory.length - 1] + '/**');
        }
        const directory = value.path_source[value.path_source.length - 1].split('/');
        value.path = directory.slice(0, directory.length - 1).join('/');
      }
    }

    delete value.path_source;
    delete value.path_destination;
    delete value.folder_source;
    delete value.folder_destination;

    if (value.bucket !== undefined) {
      attributes.bucket = value.bucket;
      delete value.bucket;
    }
    if (value.bucket_input !== undefined) {
      attributes.bucket = value.bucket_input;
      delete value.bucket_input;
    }

    if (value.bucket_policy_only !== undefined) {
      attributes.bucket_policy_only = value.bucket_policy_only;
      delete value.bucket_policy_only;
    }

    if (value.task_encryption !== undefined) {
      attributes.encryption = value.task_encryption === '' ? null : value.task_encryption;
      delete value.task_encryption;
    }
    if (value.storage_class !== undefined) {
      attributes.storage_class = value.storage_class;
      delete value.storage_class;
    }
    if (value.fast_list !== undefined) {
      attributes.fast_list = value.fast_list;
      delete value.fast_list;
    }
    if (value.chunk_size !== undefined) {
      attributes.chunk_size = value.chunk_size;
      delete value.chunk_size;
    }

    value.attributes = attributes;

    value.schedule = value.cloudsync_picker ? crontabToSchedule(value.cloudsync_picker) : {};
    delete value.cloudsync_picker;

    if (value.bwlimit !== undefined) {
      value.bwlimit = this.prepareBwlimit(value.bwlimit);
    }

    if (value.direction === Direction.Pull) {
      value.snapshot = false;
    }
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
        this.isLoading = false;
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
