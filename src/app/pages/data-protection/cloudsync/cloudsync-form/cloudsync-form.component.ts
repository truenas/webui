import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { NavigationExtras, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { find, findIndex, isArray } from 'lodash-es';
import {
  EMPTY,
  Observable, forkJoin, of,
} from 'rxjs';
import {
  catchError,
  filter, map, pairwise, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction, directionNames } from 'app/enums/direction.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { TransferMode, transferModeNames } from 'app/enums/transfer-mode.enum';
import { extractApiError } from 'app/helpers/api.helper';
import { prepareBwlimit } from 'app/helpers/bwlimit.utils';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTask, CloudSyncTaskUi, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { newOption, SelectOption } from 'app/interfaces/option.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { addNewIxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CreateStorjBucketDialogComponent } from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { CustomTransfersDialogComponent } from 'app/pages/data-protection/cloudsync/custom-transfers-dialog/custom-transfers-dialog.component';
import { TransferModeExplanationComponent } from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

const customOptionValue = -1;

type FormValue = CloudSyncFormComponent['form']['value'];

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-form',
  templateUrl: './cloudsync-form.component.html',
  styleUrls: ['./cloudsync-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    TransferModeExplanationComponent,
    IxExplorerComponent,
    TestDirective,
    IxIconComponent,
    CloudCredentialsSelectComponent,
    IxCheckboxComponent,
    SchedulerComponent,
    IxTextareaComponent,
    IxChipsComponent,
    RequiresRolesDirective,
    MatButton,
    TranslateModule,
  ],
})
export class CloudSyncFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Cloud Sync Task')
      : this.translate.instant('Edit Cloud Sync Task');
  }

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

  googleDriveProviderIds: number[] = [];

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
    filename_encryption: [false],
    encryption_password: [''],
    encryption_salt: [''],
    transfers: [4],
    bwlimit: [[] as string[]],
  });

  isLoading = false;
  bucketPlaceholder: string = helptextCloudSync.bucket_placeholder;
  bucketTooltip: string = helptextCloudSync.bucket_tooltip;
  bucketInputPlaceholder: string = helptextCloudSync.bucket_input_placeholder;
  bucketInputTooltip: string = helptextCloudSync.bucket_input_tooltip;

  readonly transferModeTooltip = `
    ${helptextCloudSync.transfer_mode_warning_sync}<br><br>
    ${helptextCloudSync.transfer_mode_warning_copy}<br><br>
    ${helptextCloudSync.transfer_mode_warning_move}
  `;

  readonly helptext = helptextCloudSync;
  readonly requiredRoles = [Role.CloudSyncWrite];

  readonly directionOptions$ = of(mapToOptions(directionNames, this.translate));
  readonly transferModeOptions$ = of(mapToOptions(transferModeNames, this.translate));

  credentialsList: CloudSyncCredential[] = [];
  providersList: CloudSyncProvider[] = [];

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
    { label: 'Glacier Instant Retrieval', value: 'GLACIER_IR' },
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

  fileNodeProvider: TreeNodeProvider;
  bucketNodeProvider: TreeNodeProvider;

  private editingTask: CloudSyncTaskUi;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private api: ApiService,
    protected router: Router,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected matDialog: MatDialog,
    private filesystemService: FilesystemService,
    protected cloudCredentialService: CloudCredentialService,
    private chainedRef: ChainedRef<CloudSyncTaskUi>,
  ) {
    this.chainedRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingTask = this.chainedRef.getData();
  }

  getCredentialsList(): Observable<CloudSyncCredential[]> {
    return this.fetchCloudSyncCredentialsList();
  }

  fetchCloudSyncCredentialsList(): Observable<CloudSyncCredential[]> {
    return this.cloudCredentialService.getCloudSyncCredentials().pipe(
      tap((credentials) => {
        this.credentialsList = credentials;
        for (const credential of credentials) {
          if (credential.provider.type === CloudSyncProviderName.GoogleDrive) {
            this.googleDriveProviderIds.push(credential.id);
          }
        }
      }),
    );
  }

  getProviders(): Observable<CloudSyncProvider[]> {
    return this.cloudCredentialService.getProviders().pipe(
      tap((providers) => {
        this.providersList = providers;
      }),
    );
  }

  ngOnInit(): void {
    this.getInitialData();
  }

  setupForm(): void {
    this.form.controls.path_source.disable();
    this.form.controls.filename_encryption.disable();
    this.form.controls.encryption_password.disable();
    this.form.controls.encryption_salt.disable();

    this.credentialsDependentControls.forEach((control) => control.disable());

    this.form.controls.bucket.valueChanges.pipe(untilDestroyed(this)).subscribe((selectedOption) => {
      if (selectedOption !== newOption) {
        this.setBucketNodeProvider();
        return;
      }
      const dialogRef = this.matDialog.open(CreateStorjBucketDialogComponent, {
        width: '500px',
        data: {
          credentialsId: this.form.controls.credentials.value,
        },
      });
      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((bucket: string | false) => {
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

    this.form.controls.credentials.valueChanges.pipe(
      startWith(undefined),
      pairwise(),
      untilDestroyed(this),
    ).subscribe(([previousCreds, currentCreds]) => {
      this.form.controls.folder_source.reset([]);
      const isPreviousValueAddNew = previousCreds != null && previousCreds.toString() === addNewIxSelectValue;
      const isCurrentValueExists = currentCreds != null;
      const isCurrentValueAddNew = isCurrentValueExists && currentCreds.toString() === addNewIxSelectValue;

      if (!isCurrentValueExists || isCurrentValueAddNew) {
        return;
      }

      if (!isPreviousValueAddNew) {
        this.handleCredentialsChange(currentCreds);
        return;
      }

      this.fetchCloudSyncCredentialsList().pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.handleCredentialsChange(currentCreds);
        },
      });
    });

    this.form.controls.path_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      this.handleFolderChange(this.form.controls.path_source, values);
    });

    this.form.controls.folder_source.valueChanges.pipe(untilDestroyed(this)).subscribe((values: string | string[]) => {
      this.handleFolderChange(this.form.controls.folder_source, values);
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
    const targetCredentials = find(this.credentialsList, { id: this.form.controls.credentials.value });

    this.cloudCredentialService.getBuckets(targetCredentials.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (buckets) => {
          const bucketOptions = buckets.map((bucket) => ({
            label: bucket.Name,
            value: bucket.Path,
            disabled: !bucket.Enabled,
          }));
          if (targetCredentials.provider.type === CloudSyncProviderName.Storj) {
            bucketOptions.unshift({
              label: this.translate.instant('Add new'),
              value: newOption,
              disabled: false,
            });
          }
          this.bucketOptions$ = of(bucketOptions);
          this.isLoading = false;
          this.form.controls.bucket.enable();
          this.form.controls.bucket_input.disable();
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.form.controls.bucket.disable();
          this.form.controls.bucket_input.enable();
          this.dialogService.closeAllDialogs();
          this.cdr.markForCheck();
          const apiError = extractApiError(error);
          if (!apiError) {
            this.errorHandler.handleError(error);
            return;
          }

          this.dialogService.confirm({
            title: apiError.extra ? (apiError.extra as { excerpt: string }).excerpt : `${this.translate.instant('Error: ')}${apiError.error}`,
            message: apiError.reason,
            hideCheckbox: true,
            buttonText: this.translate.instant('Fix Credential'),
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            const navigationExtras: NavigationExtras = { state: { editCredential: 'cloudcredentials', id: targetCredentials.id } };
            this.router.navigate(['/', 'credentials', 'backup-credentials'], navigationExtras);
          });
        },
      });
  }

  getBucketsNodeProvider(): TreeNodeProvider {
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

      return this.api.call('cloudsync.list_directory', [data]).pipe(
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

  handleCredentialsChange(credentials: number): void {
    this.credentialsDependentControls.forEach((control) => control.disable());

    if (credentials) {
      this.enableRemoteExplorer();
      const targetCredentials = find(this.credentialsList, { id: credentials });
      const targetProvider = find(this.providersList, { name: targetCredentials?.provider.type });
      if (targetProvider?.buckets) {
        this.isLoading = true;
        if (targetCredentials.provider.type === CloudSyncProviderName.MicrosoftAzure
          || targetCredentials.provider.type === CloudSyncProviderName.Hubic
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

      const schemaFound = find(this.providersList, { name: targetCredentials?.provider.type });
      const taskSchema = schemaFound ? schemaFound.task_schema : [];

      const taskSchemas = ['task_encryption', 'fast_list', 'chunk_size', 'storage_class'];
      for (const i of taskSchemas) {
        const toBeDisable = findIndex(taskSchema, { property: i }) === -1;
        if (i === 'task_encryption' || i === 'fast_list' || i === 'chunk_size' || i === 'storage_class') {
          if (toBeDisable) {
            this.form.controls[i].disable();
          } else {
            this.form.controls[i].enable();
          }
        }
      }

      this.cdr.markForCheck();
    }
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
          ? `${bwlimit.time}, ${buildNormalizedFileSize(bwlimit.bandwidth, 'B', 2)}/s`
          : `${bwlimit.time}, off`;
      }),
    });

    if (this.editingTask.direction === Direction.Pull) {
      this.form.controls.path_destination.setValue([this.editingTask.path]);

      if (this.editingTask.include?.length) {
        this.form.controls.folder_source.setValue(
          this.editingTask.include.map((path: string) => `${this.editingTask.attributes.folder as string}/${path.split('/')[1]}`),
        );
      } else {
        this.form.controls.folder_source.setValue([this.editingTask.attributes.folder as string]);
      }
    } else {
      this.form.controls.folder_destination.setValue([this.editingTask.attributes.folder as string]);

      if (this.editingTask.include?.length) {
        this.form.controls.path_source.setValue(
          this.editingTask.include.map((path: string) => `${this.editingTask.path}/${path.split('/')[1]}`),
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

  prepareData(formValue: FormValue): CloudSyncTaskUpdate {
    const attributes: CloudSyncTaskUpdate['attributes'] = {};

    const value: CloudSyncTaskUpdate = {
      ...formValue,
      attributes,
      include: [],
      path: undefined,
      bwlimit: prepareBwlimit(formValue.bwlimit),
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
      value.path = isArray(formValue.path_destination) ? formValue.path_destination[0] : formValue.path_destination;

      if (!formValue.folder_source.length || !isArray(formValue.folder_source)) {
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
      attributes.folder = isArray(formValue.folder_destination)
        ? formValue.folder_destination[0]
        : formValue.folder_destination;

      if (!formValue.path_source.length || !isArray(formValue.path_source)) {
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

  onDryRun(): void {
    const payload = this.prepareData(this.form.value);
    this.dialogService.jobDialog(
      this.api.job('cloudsync.sync_onetime', [payload, { dry_run: true }]),
      { title: this.translate.instant(helptextCloudSync.job_dialog_title_dry_run) },
    )
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Dry run completed.'));
      });
  }

  onSubmit(): void {
    const payload = this.prepareData(this.form.value);

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.api.call('cloudsync.create', [payload]);
    } else {
      request$ = this.api.call('cloudsync.update', [this.editingTask.id, payload]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (response: CloudSyncTask) => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.chainedRef.close({ response, error: null });
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  onSwitchToWizard(): void {
    this.chainedRef.swap(
      CloudSyncWizardComponent,
      true,
    );
  }

  goToManageCredentials(): void {
    this.router.navigate(['/', 'credentials', 'backup-credentials']);
    this.chainedRef.close({ response: false, error: null });
  }

  private getInitialData(): void {
    this.isLoading = true;
    forkJoin([
      this.getCredentialsList(),
      this.getProviders(),
    ]).pipe(
      catchError((error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.formErrorHandler.handleValidationErrors(error, this.form);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.isLoading = false;
      this.cdr.markForCheck();

      this.setFileNodeProvider();
      this.setBucketNodeProvider();
      this.setupForm();

      if (this.editingTask) {
        this.setTaskForEdit();
      }

      this.listenToFilenameEncryption();
    });
  }

  private listenToFilenameEncryption(): void {
    this.form.controls.filename_encryption.valueChanges.pipe(
      filter(Boolean),
      switchMap(() => this.dialogService.confirm({
        title: this.translate.instant('Warning'),
        message: this.translate.instant(
          'This option is experimental in rclone and we recommend you do not use it. Are you sure you want to continue?',
        ),
      })),
      filter((confirmed) => !confirmed),
      tap(() => this.form.controls.filename_encryption.setValue(false)),
      untilDestroyed(this),
    ).subscribe();
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

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  }

  private setBucketNodeProvider(): void {
    this.bucketNodeProvider = this.getBucketsNodeProvider();
  }
}
