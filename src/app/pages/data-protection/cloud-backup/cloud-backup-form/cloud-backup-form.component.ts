import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable, combineLatest, map, of,
} from 'rxjs';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextCloudBackup } from 'app/helptext/data-protection/cloud-backup/cloud-backup';
import { CloudBackup, CloudBackupUpdate } from 'app/interfaces/cloud-backup.interface';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { SelectOption, newOption } from 'app/interfaces/option.interface';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';

type FormValue = CloudBackupFormComponent['form']['value'];

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-form',
  templateUrl: './cloud-backup-form.component.html',
  styleUrls: ['./cloud-backup-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add TrueCloud Backup Task')
      : this.translate.instant('Edit TrueCloud Backup Task');
  }

  form = this.fb.group({
    path: [[] as string[], [Validators.required]],
    credentials: [null as number, [Validators.required]],
    schedule: [CronPresetValue.Daily, [Validators.required]],
    exclude: [[] as string[]],
    pre_script: [''],
    post_script: [''],
    description: [''],
    snapshot: [false],
    transfers: [null as number],
    args: [''],
    enabled: [true],
    password: ['', [Validators.required]],
    keep_last: [null as number, [Validators.required]],

    folder: ['', [Validators.required]],
    bucket: ['', [Validators.required]],
    bucket_input: ['', [Validators.required]],
  });

  isLoading = false;
  editingTask: CloudBackup;

  bucketOptions$ = of<SelectOption[]>([]);

  fileNodeProvider: TreeNodeProvider;
  bucketNodeProvider: TreeNodeProvider;

  readonly newOption = newOption;
  readonly requiredRoles = [Role.CloudBackupWrite];
  readonly helptext = helptextCloudBackup;

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private filesystemService: FilesystemService,
    private cloudCredentialService: CloudCredentialService,
    private chainedRef: ChainedRef<CloudBackup>,
  ) {
    this.editingTask = chainedRef.getData();
  }

  ngOnInit(): void {
    this.setFileNodeProvider();
    this.setBucketNodeProvider();

    combineLatest([
      this.cloudCredentialService.getCloudSyncCredentials(),
      this.cloudCredentialService.getProviders(),
      this.form.controls.credentials.valueChanges,
    ]).pipe(untilDestroyed(this)).subscribe(([credentialsList, providersList, credentialId]) => {
      const targetCredentials = _.find(credentialsList, { id: credentialId });
      const targetProvider = _.find(providersList, { name: targetCredentials?.provider });

      if (credentialId && targetProvider.buckets) {
        this.form.controls.folder.enable();
        this.loadBucketOptions(credentialId);
      } else if (credentialId) {
        this.form.controls.folder.enable();
        this.form.controls.bucket.disable();
        this.form.controls.bucket_input.disable();
      } else {
        this.form.controls.folder.disable();
        this.form.controls.bucket.disable();
        this.form.controls.bucket_input.disable();
      }
    });

    this.form.controls.bucket.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === newOption) {
        this.form.controls.bucket_input.enable();
      } else {
        this.form.controls.bucket_input.disable();
      }
      this.setBucketNodeProvider();
    });

    this.form.controls.bucket_input.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setBucketNodeProvider();
    });

    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  loadBucketOptions(credentialId: number): void {
    this.isLoading = true;
    this.cloudCredentialService.getBuckets(credentialId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (buckets) => {
          const bucketOptions = buckets.map((bucket) => ({
            label: bucket.Name,
            value: bucket.Path,
            disabled: !bucket.Enabled,
          }));
          bucketOptions.unshift({
            label: this.translate.instant('Add new'),
            value: newOption,
            disabled: false,
          });
          this.bucketOptions$ = of(bucketOptions);
          this.isLoading = false;
          this.form.controls.bucket.enable();
          this.form.controls.bucket_input.disable();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.form.controls.bucket.disable();
          this.form.controls.bucket_input.enable();
          this.cdr.markForCheck();
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

  setTaskForEdit(): void {
    this.form.patchValue({
      ...this.editingTask,
      schedule: scheduleToCrontab(this.editingTask.schedule) as CronPresetValue,
      path: [],
      credentials: (this.editingTask.credentials as CloudCredential).id,
      folder: this.editingTask.attributes.folder as string,
      bucket: this.editingTask.attributes.bucket === newOption ? '' : this.editingTask.attributes.bucket as string,
    });

    if (this.editingTask.include?.length) {
      this.form.controls.path.setValue(
        this.editingTask.include.map((path: string) => (`${this.editingTask.path}/${path.split('/')[1]}`)),
      );
    } else {
      this.form.controls.path.setValue([this.editingTask.path]);
    }
  }

  onSubmit(): void {
    const payload = this.prepareData(this.form.value);

    this.isLoading = true;
    let request$: Observable<unknown>;

    if (this.isNew) {
      request$ = this.ws.call('cloud_backup.create', [payload]);
    } else {
      request$ = this.ws.call('cloud_backup.update', [this.editingTask.id, payload]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (response: CloudBackup) => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.cdr.markForCheck();
        this.chainedRef.close({ response, error: null });
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private prepareData(formValue: FormValue): CloudBackupUpdate {
    const attributes: CloudBackupUpdate['attributes'] = {
      folder: formValue.folder,
      bucket: formValue.bucket,
    };

    const value: CloudBackupUpdate = {
      ...formValue,
      attributes,
      include: [],
      path: undefined,
      bwlimit: undefined,
      schedule: crontabToSchedule(formValue.schedule),
    };

    if (!formValue.path.length || !_.isArray(formValue.path)) {
      value.path = '/';
    } else if (formValue.path.length === 1) {
      value.path = formValue.path[0];
    } else {
      value.include = [];
      for (const dir of formValue.path) {
        const directory = dir.split('/');
        value.include.push('/' + directory[directory.length - 1] + '/**');
      }
      const directory = formValue.path[formValue.path.length - 1].split('/');
      value.path = directory.slice(0, directory.length - 1).join('/');
    }

    delete (value as unknown as FormValue).folder;
    delete (value as unknown as FormValue).bucket;
    delete (value as unknown as FormValue).bucket_input;

    return value;
  }

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  }

  private setBucketNodeProvider(): void {
    this.bucketNodeProvider = this.getBucketsNodeProvider();
  }
}
