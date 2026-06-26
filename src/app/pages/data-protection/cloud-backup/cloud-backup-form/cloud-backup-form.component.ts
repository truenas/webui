import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnBannerComponent,
  TnBannerActionDirective,
  TnCheckboxComponent,
  TnChipInputComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  Observable, debounceTime, distinctUntilChanged, filter, map, of,
} from 'rxjs';
import { slashRootNode } from 'app/constants/basic-root-nodes.constant';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { CloudsyncTransferSetting, cloudsyncTransferSettingLabels } from 'app/enums/cloudsync-transfer-setting.enum';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextCloudBackup } from 'app/helptext/data-protection/cloud-backup/cloud-backup';
import { CloudBackup, CloudBackupUpdate } from 'app/interfaces/cloud-backup.interface';
import { SelectOption, newOption } from 'app/interfaces/option.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { TreeNodeProvider } from 'app/modules/forms/ix-forms/components/ix-explorer/tree-node-provider.interface';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { addNewIxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select-with-new-option.directive';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';

type FormValue = CloudBackupFormComponent['form']['value'];

@Component({
  selector: 'ix-cloud-backup-form',
  templateUrl: './cloud-backup-form.component.html',
  styleUrls: ['./cloud-backup-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnChipInputComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    CloudCredentialsSelectComponent,
    SchedulerComponent,
    TranslateModule,
    TnBannerComponent,
    TnBannerActionDirective,
  ],
})
export class CloudBackupFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private filesystemService = inject(FilesystemService);
  private cloudCredentialService = inject(CloudCredentialService);
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the
  // `<tn-side-panel>` form panel, where data arrives via {@link backupToEdit}.
  private slideInRef = inject<SlideInRef<CloudBackup | undefined, CloudBackup>>(SlideInRef, { optional: true });
  private destroyRef = inject(DestroyRef);

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly backupToEdit = input<CloudBackup | undefined>(undefined);

  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  get isNew(): boolean {
    return !this.editingTask;
  }

  get isNewBucketOptionSelected(): boolean {
    return this.form.value.bucket === newOption;
  }

  protected readonly slashRootNode = [slashRootNode];

  protected readonly InputType = InputType;

  protected readonly newBucketOption = {
    label: this.translate.instant('Add new'),
    value: newOption,
    disabled: false,
  };

  protected form = this.fb.group({
    path: ['', [Validators.required]],
    cache_path: [null as string | null],
    credentials: new FormControl(null as number | null, [Validators.required]),
    schedule: [CronPresetValue.Daily, [Validators.required]],
    exclude: [[] as string[]],
    pre_script: [''],
    post_script: [''],
    description: ['', [Validators.required]],
    snapshot: [false],
    absolute_paths: [false],
    transfer_setting: [CloudsyncTransferSetting.Default],
    args: [''],
    enabled: [true],
    password: ['', [Validators.required]],
    keep_last: new FormControl(null as number | null, [Validators.required]),
    rate_limit: new FormControl(null as number | null, [Validators.min(1)]),

    folder: ['', [Validators.required]],
    bucket: ['', [Validators.required]],
    bucket_input: ['', [Validators.required]],
  });

  protected isLoading = signal(false);
  protected editingTask: CloudBackup | undefined;

  bucketOptions$ = of<SelectOption[]>([]);
  transferSettings$ = this.api.call('cloud_backup.transfer_setting_choices').pipe(
    map((availableSettings) => {
      const allOptions = mapToOptions(cloudsyncTransferSettingLabels, this.translate);
      return allOptions.filter((option) => availableSettings.includes(option.value as CloudsyncTransferSetting));
    }),
  );

  fileNodeProvider: TreeNodeProvider;
  directoriesNodeProvider: TreeNodeProvider;
  bucketNodeProvider: TreeNodeProvider;

  readonly newOption = newOption;
  readonly requiredRoles = [Role.CloudBackupWrite];
  protected readonly CloudSyncProviderName = CloudSyncProviderName;

  readonly helptext = helptextCloudBackup;
  readonly storjAccountUrl = 'https://www.storj.io/get-started';
  readonly documentationUrl = 'https://www.truenas.com/docs/scale/dataprotection/truecloud/truecloudtasks/';

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }

  /** Whether the form may be submitted right now; the `<tn-side-panel>` host reads this for its Save action. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  ngOnInit(): void {
    this.editingTask = this.slideInRef?.getData() ?? this.backupToEdit();

    this.setFileNodeProvider();
    this.setDirectoriesNodeProvider();
    this.setBucketNodeProvider();

    this.listenForCredentialsChanges();
    this.listenForBucketChanges();
    this.listenForBucketInputChanges();

    if (this.editingTask) {
      this.setTaskForEdit(this.editingTask);
      this.form.controls.absolute_paths.disable();
    } else {
      this.listenForTakeSnapshotChanges();
    }
  }

  loadBucketOptions(credentialId: number): void {
    this.isLoading.set(true);
    this.cloudCredentialService.getBuckets(credentialId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (buckets) => {
          const bucketOptions = buckets.map((bucket) => ({
            label: bucket.Name,
            value: bucket.Path,
            disabled: !bucket.Enabled,
          }));
          bucketOptions.unshift(this.newBucketOption);
          this.bucketOptions$ = of(bucketOptions);
          this.isLoading.set(false);
          this.form.controls.bucket.enable();
          this.form.controls.bucket_input.disable();
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.bucketOptions$ = of([this.newBucketOption]);
          this.isLoading.set(false);
        },
      });
  }

  getBucketsNodeProvider(): TreeNodeProvider {
    return (node: TreeNode<ExplorerNodeData>) => {
      let bucket = '';
      if (this.form.controls.bucket.enabled && this.form.value.bucket !== newOption) {
        bucket = this.form.controls.bucket.value;
      } else if (this.form.controls.bucket_input.enabled) {
        bucket = this.form.controls.bucket_input.value;
      }

      const data = {
        credentials: this.form.controls.credentials.value,
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
                name: file.Decrypted ? file.Decrypted : file.Name,
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

  setTaskForEdit(editingTask: CloudBackup): void {
    this.form.patchValue({
      ...editingTask,
      schedule: scheduleToCrontab(editingTask.schedule) as CronPresetValue,
      path: editingTask.path,
      cache_path: editingTask.cache_path,
      credentials: editingTask.credentials.id,
      folder: editingTask.attributes.folder as string,
      bucket: editingTask.attributes.bucket === newOption ? '' : editingTask.attributes.bucket as string || '',
      rate_limit: editingTask.rate_limit,
    });
  }

  protected handleSubmit = (): SubmitResult => {
    const payload = this.prepareData(this.form.value);
    const request$: Observable<CloudBackup> = this.editingTask
      ? this.api.call('cloud_backup.update', [this.editingTask.id, payload])
      : this.api.call('cloud_backup.create', [payload]);

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Task created')
        : this.translate.instant('Task updated'),
      // SlideIn host listeners expect the saved record (slideInRef.close({ response })).
      closeWith: (response: unknown) => response as CloudBackup,
    };
  };

  private listenForCredentialsChanges(): void {
    this.form.controls.credentials.valueChanges
      .pipe(
        filter((credentialId) => credentialId?.toString() !== addNewIxSelectValue),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((credentialId) => {
        if (credentialId !== (this.editingTask?.credentials?.id || null)) {
          this.form.controls.bucket.patchValue('');
        }

        this.form.controls.bucket_input.disable();

        if (credentialId) {
          this.form.controls.folder.enable();
          this.form.controls.bucket.enable();
          this.loadBucketOptions(credentialId);
        } else {
          this.form.controls.folder.disable();
          this.form.controls.bucket.disable();
        }
      });
  }

  private listenForBucketChanges(): void {
    this.form.controls.bucket.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value === newOption) {
          this.form.controls.bucket_input.patchValue('');
          this.form.controls.bucket_input.enable();
        } else {
          this.form.controls.bucket_input.disable();
        }
        this.setBucketNodeProvider();
      });
  }

  private listenForBucketInputChanges(): void {
    this.form.controls.bucket_input.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.setBucketNodeProvider();
      });
  }

  private listenForTakeSnapshotChanges(): void {
    this.form.controls.snapshot.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((takeSnapshot) => {
        if (takeSnapshot) {
          this.form.controls.absolute_paths.setValue(false);
          this.form.controls.absolute_paths.disable();
        } else {
          this.form.controls.absolute_paths.enable();
        }
      });
  }

  private prepareData(formValue: FormValue): CloudBackupUpdate {
    const attributes: CloudBackupUpdate['attributes'] = {
      folder: formValue.folder,
      bucket: this.form.value.bucket_input && this.isNewBucketOptionSelected
        ? this.form.value.bucket_input
        : formValue.bucket,
    };

    const {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      folder, bucket, bucket_input, ...restOfValues
    } = formValue;

    const value: CloudBackupUpdate = {
      ...restOfValues,
      attributes,
      include: [],
      schedule: crontabToSchedule(formValue.schedule),
    };

    return value;
  }

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({
      datasetsAndZvols: true,
    });
  }

  private setDirectoriesNodeProvider(): void {
    this.directoriesNodeProvider = this.filesystemService.getFilesystemNodeProvider({
      directoriesOnly: true,
    });
  }

  private setBucketNodeProvider(): void {
    this.bucketNodeProvider = this.getBucketsNodeProvider();
  }
}
