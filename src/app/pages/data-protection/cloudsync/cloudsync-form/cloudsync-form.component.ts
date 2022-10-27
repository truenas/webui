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
import { filter, map, switchMap } from 'rxjs/operators';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext from 'app/helptext/data-protection/cloudsync/cloudsync-form';
import { BwLimit, CloudSyncTaskUpdate, CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncBucket, CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { ExplorerNodeData } from 'app/interfaces/tree-node.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { CreateStorjBucketDialogComponent } from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { CloudCredentialService, DialogService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const newStorjBucket = 'new_storj_bucket';

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
    path_destination: [[mntPath], Validators.required],
    path_source: [[mntPath], Validators.required],

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

  credentialsList: CloudsyncCredential[] = [];
  readonly credentialsOptions$ = this.cloudCredentialService.getCloudsyncCredentials().pipe(
    map((options) => {
      return options.map((option) => (
        { label: `${option.name} (${option.provider})`, value: option.id }
      ));
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

  bucketOptions$: Observable<SelectOption[]> = of([]);

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

  setTaskForEdit(task: CloudSyncTaskUi): void {
    this.editingTask = task;

    this.form.patchValue({
      ...task,
      cloudsync_picker: scheduleToCrontab(task.schedule) as CronPresetValue,
      credentials: task.credentials.id,
      encryption: task.encryption,
      bwlimit: task.bwlimit.map((bwlimit) => {
        return bwlimit.bandwidth
          ? `${bwlimit.time}, ${filesize(+bwlimit.bandwidth)}`
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

  prepareBwlimit(bwlimit: string[]): BwLimit[] {
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
        bandwidth: sublimitArr[1] === 'off' ? null : +sublimitArr[1],
      };

      bwlimtArr.push(subLimit);
    }
    return bwlimtArr;
  }

  prepareData(formValue: CloudsyncFormComponent['form']['value']): CloudSyncTaskUpdate {
    const attributes: CloudSyncTaskUpdate['attributes'] = {};

    const value = this.buildInitialRequestBody(formValue);

    if (value.direction === Direction.Pull) {
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

    if (formValue.bucket !== undefined) {
      attributes.bucket = formValue.bucket;
    }
    if (formValue.bucket_input !== undefined) {
      attributes.bucket = formValue.bucket_input;
    }
    if (formValue.bucket_policy_only !== undefined) {
      attributes.bucket_policy_only = formValue.bucket_policy_only;
    }
    if (formValue.task_encryption !== undefined) {
      attributes.encryption = formValue.task_encryption === '' ? null : formValue.task_encryption;
    }
    if (formValue.storage_class !== undefined) {
      attributes.storage_class = formValue.storage_class;
    }
    if (formValue.fast_list !== undefined) {
      attributes.fast_list = formValue.fast_list;
    }
    if (formValue.chunk_size !== undefined) {
      attributes.chunk_size = formValue.chunk_size;
    }

    value.attributes = attributes;

    value.schedule = formValue.cloudsync_picker ? crontabToSchedule(formValue.cloudsync_picker) : {};

    if (formValue.direction === Direction.Pull) {
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

  private buildInitialRequestBody(formValue: CloudsyncFormComponent['form']['value']): CloudSyncTaskUpdate {
    return {
      attributes: undefined,
      bwlimit: formValue.bwlimit ? this.prepareBwlimit(formValue.bwlimit) : undefined,
      create_empty_src_dirs: formValue.create_empty_src_dirs,
      credentials: formValue.credentials,
      description: formValue.description,
      direction: formValue.direction,
      enabled: formValue.enabled,
      encryption: formValue.encryption,
      exclude: formValue.exclude,
      follow_symlinks: formValue.follow_symlinks,
      include: undefined,
      path: undefined,
      post_script: formValue.post_script,
      pre_script: formValue.pre_script,
      schedule: undefined,
      snapshot: formValue.snapshot,
      transfer_mode: formValue.transfer_mode,
      transfers: formValue.transfers,
    };
  }
}
