import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { LifetimeUnit, lifetimeUnitNames } from 'app/enums/lifetime-unit.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { CloudBackup, CloudBackupUpdate } from 'app/interfaces/cloud-backup.interface';
import { SelectOption, newOption } from 'app/interfaces/option.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    path: [[mntPath], [Validators.required]],
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

    name: ['', [Validators.required]],
    lifetime_value: [null as number, [Validators.required]],
    lifetime_unit: [LifetimeUnit.Week, [Validators.required]],

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
  readonly lifetimeUnits$ = of(mapToOptions(lifetimeUnitNames, this.translate));

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private filesystemService: FilesystemService,
    private chainedRef: ChainedRef<CloudBackup>,
  ) {
    this.editingTask = chainedRef.getData();
  }

  ngOnInit(): void {
    this.setFileNodeProvider();
    this.setBucketNodeProvider();

    this.form.controls.credentials.valueChanges.pipe(untilDestroyed(this)).subscribe((credentials) => {
      if (credentials) {
        this.loadBucketOptions(credentials);
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

    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  loadBucketOptions(credentials: number): void {
    // eslint-disable-next-line no-console
    console.log(credentials);
    // TODO: Implement loadBucketOptions logic
  }

  getBucketsNodeProvider(): TreeNodeProvider {
    return () => {
      // TODO: Implement getBucketsNodeProvider logic
      return of([]);
    };
  }

  setTaskForEdit(): void {
    // TODO: Implement setTaskForEdit logic

    this.form.patchValue({
      ...this.editingTask,
      schedule: scheduleToCrontab(this.editingTask.schedule) as CronPresetValue,
      path: [],
      credentials: null,
    });

    // this.form.controls.folder.setValue([this.editingTask.attributes.folder]);

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
    };

    const value: CloudBackupUpdate = {
      ...formValue,
      attributes,
      include: [],
      path: undefined,
      bwlimit: undefined,
      keep_last: undefined,
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

    delete (value as unknown as FormValue).name;
    delete (value as unknown as FormValue).lifetime_value;
    delete (value as unknown as FormValue).lifetime_unit;

    return value;
  }

  private setFileNodeProvider(): void {
    this.fileNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  }

  private setBucketNodeProvider(): void {
    this.bucketNodeProvider = this.getBucketsNodeProvider();
  }
}
