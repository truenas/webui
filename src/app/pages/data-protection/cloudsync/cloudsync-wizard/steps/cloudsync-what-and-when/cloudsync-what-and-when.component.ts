import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { Validators, FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NavigationExtras, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable, combineLatest, filter, map, merge, of, tap,
} from 'rxjs';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction, directionNames } from 'app/enums/direction.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { TransferMode, transferModeNames } from 'app/enums/transfer-mode.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { newOption, Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CreateStorjBucketDialogComponent } from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

type FormValue = CloudSyncWhatAndWhenComponent['form']['value'];

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-what-and-when',
  templateUrl: './cloudsync-what-and-when.component.html',
  styleUrls: ['./cloudsync-what-and-when.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudSyncWhatAndWhenComponent implements OnInit, OnChanges {
  @Input() credentialId: number;
  @Output() save = new EventEmitter<void>();

  form = this.formBuilder.group({
    description: ['' as string, Validators.required],
    direction: [Direction.Pull, Validators.required],
    transfer_mode: [TransferMode.Copy, Validators.required],
    path_destination: [[mntPath], Validators.required],
    path_source: [[mntPath], Validators.required],

    credentials: [null as number],
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

  credentials: CloudSyncCredential[] = [];
  providers: CloudSyncProvider[] = [];
  bucketPlaceholder: string = helptextCloudSync.bucket_placeholder;
  bucketTooltip: string = helptextCloudSync.bucket_tooltip;
  bucketInputPlaceholder: string = helptextCloudSync.bucket_input_placeholder;
  bucketInputTooltip: string = helptextCloudSync.bucket_input_tooltip;
  googleDriveProviderIds: number[] = [];
  bucketOptions$: Observable<Option[]>;

  fileNodeProvider: TreeNodeProvider;
  bucketNodeProvider: TreeNodeProvider;

  readonly directionOptions$ = of(mapToOptions(directionNames, this.translate));
  readonly transferModeOptions$ = of(mapToOptions(transferModeNames, this.translate));
  readonly helptext = helptextCloudSync;
  readonly requiredRoles = [Role.CloudSyncWrite];
  readonly transferModeTooltip = `
    ${helptextCloudSync.transfer_mode_warning_sync}<br><br>
    ${helptextCloudSync.transfer_mode_warning_copy}<br><br>
    ${helptextCloudSync.transfer_mode_warning_move}
  `;

  get credentialsDependentControls(): FormControl[] {
    return [
      this.form.controls.bucket,
      this.form.controls.bucket_input,
      this.form.controls.bucket_policy_only,
      this.form.controls.folder_source,
      this.form.controls.folder_destination,
      this.form.controls.task_encryption,
      this.form.controls.fast_list,
      this.form.controls.chunk_size,
      this.form.controls.storage_class,
    ];
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private chainedRef: ChainedRef<unknown>,
    private dialog: DialogService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private filesystemService: FilesystemService,
    private cloudCredentialService: CloudCredentialService,
    private matDialog: MatDialog,
    private router: Router,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!changes?.credentialId?.currentValue) {
      return;
    }
    combineLatest([
      this.getProviders(),
      this.getCloudCredentials(),
    ]).pipe(
      tap(() => {
        this.form.controls.credentials.setValue(changes.credentialId.currentValue);
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnInit(): void {
    this.setupForm();
    this.setupFormListeners();
    this.setFileNodeProvider();
    this.setBucketNodeProvider();
  }

  onSave(): void {
    this.save.emit();
  }

  getPayload(): CloudSyncTaskUpdate {
    const formValue: FormValue = this.form.value;
    const attributes: CloudSyncTaskUpdate['attributes'] = {};

    const value = {
      ...formValue,
      attributes,
      include: undefined,
      path: undefined,
      bwlimit: formValue.bwlimit ? this.prepareBwlimit(formValue.bwlimit) : undefined,
      schedule: formValue.cloudsync_picker ? crontabToSchedule(formValue.cloudsync_picker) : {},
      snapshot: formValue.direction === Direction.Pull ? false : formValue.snapshot,
    } as CloudSyncTaskUpdate;

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

      if (!formValue.folder_source?.length || !_.isArray(formValue.folder_source)) {
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
      if (
        name === 'acknowledge_abuse'
        && !this.googleDriveProviderIds.includes(this.form.controls.credentials.value)
      ) {
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

  openAdvanced(): void {
    this.dialog.confirm({
      title: this.translate.instant('Switch to Advanced Options'),
      message: this.translate.instant('Switching to Advanced Options will lose data entered on second step. Do you want to continue?'),
      buttonText: this.translate.instant('Continue'),
      cancelText: this.translate.instant('Cancel'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.chainedRef.swap(CloudSyncFormComponent, true);
    });
  }

  getProviders(): Observable<CloudSyncProvider[]> {
    return this.cloudCredentialService.getProviders().pipe(
      tap((providers) => {
        this.providers = providers;
      }),
    );
  }

  getCloudCredentials(): Observable<CloudSyncCredential[]> {
    return this.cloudCredentialService.getCloudSyncCredentials().pipe(
      tap((credentials) => {
        this.credentials = credentials;
        for (const credential of credentials) {
          if (credential.provider === CloudSyncProviderName.GoogleDrive) {
            this.googleDriveProviderIds.push(credential.id);
          }
        }
      }),
    );
  }

  private setupForm(): void {
    this.form.controls.path_source.disable();
    this.form.controls.filename_encryption.disable();
    this.form.controls.encryption_password.disable();
    this.form.controls.encryption_salt.disable();

    this.credentialsDependentControls.forEach((control) => control.disable());
  }

  private setupFormListeners(): void {
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

    merge(
      this.form.controls.path_source.valueChanges,
      this.form.controls.path_destination.valueChanges,
    ).pipe(
      filter(Boolean),
      map((values) => (Array.isArray(values) ? values.join('/') : values)),
      untilDestroyed(this),
    ).subscribe((path) => {
      this.updateDescriptionPath(path);
    });

    this.form.controls.path_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      this.handleFolderChange(this.form.controls.path_source, values);
    });

    this.form.controls.folder_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      this.handleFolderChange(this.form.controls.folder_source, values);
    });

    this.form.controls.credentials.valueChanges.pipe(untilDestroyed(this)).subscribe((credential) => {
      this.form.controls.folder_source.reset([]);
      this.credentialsDependentControls.forEach((control) => control.disable());

      if (credential) {
        this.enableRemoteExplorer();
        const targetCredentials = _.find(this.credentials, { id: credential });
        const targetProvider = _.find(this.providers, { name: targetCredentials?.provider });
        if (targetProvider?.buckets) {
          if (
            [
              CloudSyncProviderName.MicrosoftAzure,
              CloudSyncProviderName.Hubic,
            ].includes(targetCredentials.provider)
          ) {
            this.bucketPlaceholder = this.translate.instant('Container');
            this.bucketTooltip = this.translate.instant('Select the pre-defined container to use.');
            this.bucketInputPlaceholder = this.translate.instant('Container');
            this.bucketInputTooltip = this.translate.instant('Input the pre-defined container to use.');
          } else {
            this.bucketPlaceholder = helptextCloudSync.bucket_placeholder;
            this.bucketTooltip = helptextCloudSync.bucket_tooltip;
            this.bucketInputPlaceholder = helptextCloudSync.bucket_input_placeholder;
            this.bucketInputTooltip = helptextCloudSync.bucket_input_tooltip;
          }

          this.loadBucketOptions();

          this.cdr.markForCheck();
        } else {
          this.form.controls.bucket.disable();
          this.form.controls.bucket_input.disable();
        }

        if (targetProvider?.name === CloudSyncProviderName.GoogleCloudStorage) {
          this.form.controls.bucket_policy_only.enable();
        } else {
          this.form.controls.bucket_policy_only.disable();
        }

        const schemaFound = _.find(this.providers, { name: targetCredentials?.provider });
        const taskSchema = schemaFound ? schemaFound.task_schema : [];

        const taskSchemas = ['task_encryption', 'fast_list', 'chunk_size', 'storage_class'];
        for (const i of taskSchemas) {
          const toBeDisable = !(_.findIndex(taskSchema, { property: i }) > -1);
          if (i === 'task_encryption' || i === 'fast_list' || i === 'chunk_size' || i === 'storage_class') {
            if (toBeDisable) {
              this.form.controls[i].disable();
            } else {
              this.form.controls[i].enable();
            }
          }
        }
      }
    });

    this.form.controls.bucket.valueChanges.pipe(
      filter((selectedOption) => selectedOption === newOption),
      untilDestroyed(this),
    ).subscribe(() => {
      const dialogRef = this.matDialog.open(CreateStorjBucketDialogComponent, {
        width: '500px',
        data: {
          credentialsId: this.form.controls.credentials.value,
        },
      });
      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((bucket: string | false) => {
        if (bucket !== false) {
          this.loadBucketOptions();
          this.form.controls.bucket.setValue(bucket);
        } else {
          this.form.controls.bucket.setValue('');
        }
      });
    });
  }

  private loadBucketOptions(): void {
    const credential = _.find(this.credentials, { id: this.form.controls.credentials.value });

    this.cloudCredentialService.getBuckets(credential.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (buckets) => {
          const bucketOptions = buckets.map((bucket) => ({
            label: bucket.Name,
            value: bucket.Path,
            disabled: !bucket.Enabled,
          }));
          if (credential.provider === CloudSyncProviderName.Storj) {
            bucketOptions.unshift({
              label: this.translate.instant('Add new'),
              value: newOption,
              disabled: false,
            });
          }
          this.bucketOptions$ = of(bucketOptions);
          this.form.controls.bucket.enable();
          this.form.controls.bucket_input.disable();
          this.cdr.markForCheck();
        },
        error: (error: WebSocketError) => {
          this.form.controls.bucket.disable();
          this.form.controls.bucket_input.enable();
          this.dialog.closeAllDialogs();
          this.dialog.confirm({
            title: error.extra ? (error.extra as { excerpt: string }).excerpt : `${this.translate.instant('Error: ')}${error.error}`,
            message: error.reason,
            hideCheckbox: true,
            buttonText: this.translate.instant('Fix Credential'),
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            const extra: NavigationExtras = { state: { editCredential: 'cloudcredentials', id: credential.id } };
            this.router.navigate(['/', 'credentials', 'backup-credentials'], extra);
          });
          this.cdr.markForCheck();
        },
      });
  }

  private getBucketsNodeProvider(): TreeNodeProvider {
    return (node: TreeNode<ExplorerNodeData>) => {
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
          folder: node.data.path,
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
                path: `${data.attributes.folder}/${file.Name}`.replace(/\/+/g, '/'),
                name: file.Name,
                type: ExplorerNodeType.Directory,
                hasChildren: true,
              });
            }
          });

          return nodes;
        }),
      );
    };
  }

  private prepareBwlimit(bwlimit: string[]): CloudSyncTaskUpdate['bwlimit'] {
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

  private enableRemoteExplorer(): void {
    this.setBucketNodeProvider();

    if (this.form.controls.direction.value === Direction.Pull) {
      this.form.controls.folder_source.enable();
      this.form.controls.folder_destination.disable();
    } else {
      this.form.controls.folder_source.disable();
      this.form.controls.folder_destination.enable();
    }
  }

  private updateDescriptionPath(path: string): void {
    if (!this.form.controls.description.touched) {
      const [name] = this.form.controls.description.value.split(' - ');
      this.form.controls.description.setValue(`${name} - ${path}`);
    }
  }

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  }

  private setBucketNodeProvider(): void {
    this.bucketNodeProvider = this.getBucketsNodeProvider();
  }

  private handleFolderChange(formControl: FormControl, values: string | string[]): void {
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

    let prevErrors = formControl.errors;
    if (prevErrors === null) {
      prevErrors = {};
    }

    if (!allMatch) {
      formControl.setErrors({
        ...prevErrors,
        misMatchDirectories: {
          message: this.translate.instant('All selected directories must be at the same level i.e., must have the same parent directory.'),
        },
      });
    } else {
      delete prevErrors.misMatchDirectories;
      if (Object.keys(prevErrors).length) {
        formControl.setErrors({ ...prevErrors });
      } else {
        formControl.setErrors(null);
      }
    }
  }
}
