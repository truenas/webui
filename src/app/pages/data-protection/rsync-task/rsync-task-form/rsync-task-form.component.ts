import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, output, viewChild,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { Direction } from 'app/enums/direction.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import { helptextRsyncForm } from 'app/helptext/data-protection/rsync/rsync-form';
import { newOption } from 'app/interfaces/option.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

@Component({
  selector: 'ix-rsync-task-form',
  templateUrl: './rsync-task-form.component.html',
  styleUrls: ['./rsync-task-form.component.scss'],
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
    IxSlideToggleComponent,
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    IxUserComboboxComponent,
    SshCredentialsSelectComponent,
    SchedulerComponent,
    TranslateModule,
  ],
})
export class RsyncTaskFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private filesystemService = inject(FilesystemService);
  private validatorsService = inject(IxValidatorsService);
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the
  // `<tn-side-panel>` form panel, where data arrives via {@link taskToEdit}.
  private slideInRef = inject<SlideInRef<RsyncTask | undefined, boolean>>(SlideInRef, { optional: true });
  private destroyRef = inject(DestroyRef);

  /** The record being edited, supplied by the `<tn-side-panel>` host (undefined = create). */
  readonly taskToEdit = input<RsyncTask | undefined>(undefined);

  // This form hosts `<ix-form>` directly and forwards its submit()/canSubmit()/isBusy()/closed, so it
  // follows the ix-form dual-host recipe rather than extending `SidePanelForm` (whose `submit()` drives a
  // subclass-owned form group + `canSubmit` signal — incompatible with delegating to the inner ix-form).
  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (forwarded from `<ix-form>`). */
  readonly closed = output<boolean>();

  /** The inner `<ix-form>`, used to expose the host-facing dual-host surface. */
  private readonly ixForm = viewChild(IxFormComponent);

  readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly InputType = InputType;

  get isNew(): boolean {
    return !this.editingTask;
  }

  form = this.formBuilder.group({
    path: ['', Validators.required],
    user: ['', Validators.required],
    direction: new FormControl(null as Direction | null, Validators.required),
    desc: [''],
    mode: [RsyncMode.Module],
    remotehost: ['', this.validatorsService.validateOnCondition(
      (control) => Boolean(control.parent) && this.isModuleMode,
      Validators.required,
    )],
    ssh_keyscan: [false],
    remoteport: [22, portRangeValidator()],
    remotemodule: ['', this.validatorsService.validateOnCondition(
      (control) => Boolean(control.parent) && this.isModuleMode,
      Validators.required,
    )],
    remotepath: [mntPath],
    validate_rpath: [true],
    schedule: ['', Validators.required],
    recursive: [true],
    times: [true],
    compress: [true],
    archive: [false],
    delete: [false],
    quiet: [false],
    preserveperm: [false],
    preserveattr: [false],
    delayupdates: [true],
    extra: [[] as string[]],
    enabled: [true],
    sshconnectmode: [RsyncSshConnectMode.PrivateKey],
    ssh_credentials: new FormControl(null as number | typeof newOption | null),
  });

  readonly helptext = helptextRsyncForm;

  readonly directions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly rsyncModes$ = of([
    { label: this.translate.instant('Module'), value: RsyncMode.Module },
    { label: ignoreTranslation('SSH'), value: RsyncMode.Ssh },
  ]);

  readonly sshConnectModes$ = of([
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ]);

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  protected editingTask: RsyncTask | undefined;

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

  get isModuleMode(): boolean {
    return this.form.value.mode === RsyncMode.Module;
  }

  get isRemoteHostSpecified(): boolean {
    return this.form.controls.remotehost.valid;
  }

  get isSshConnectionPrivateMode(): boolean {
    return this.form.value.sshconnectmode === RsyncSshConnectMode.PrivateKey;
  }

  ngOnInit(): void {
    this.editingTask = this.slideInRef?.getData() ?? this.taskToEdit();

    if (this.editingTask) {
      this.setTaskForEdit(this.editingTask);
    }
  }

  setTaskForEdit(editingTask: RsyncTask): void {
    this.form.patchValue({
      ...editingTask,
      schedule: scheduleToCrontab(editingTask.schedule),
      sshconnectmode: editingTask.ssh_credentials ? RsyncSshConnectMode.KeyChain : RsyncSshConnectMode.PrivateKey,
      ssh_credentials: editingTask.ssh_credentials?.id || null,
    });
  }

  protected handleSubmit = (): SubmitResult => {
    const values = {
      ...this.form.value,
      schedule: crontabToSchedule(this.form.value.schedule),
    };

    if (values.mode === RsyncMode.Module) {
      delete values.remoteport;
      delete values.remotepath;
      delete values.validate_rpath;
      delete values.ssh_keyscan;
      values.ssh_credentials = null;
    } else {
      delete values.remotemodule;
      if (values.sshconnectmode === RsyncSshConnectMode.PrivateKey) {
        values.ssh_credentials = null;
      } else {
        values.remotehost = null;
        values.remoteport = null;
        delete values.ssh_keyscan;
      }
    }
    delete values.sshconnectmode;

    const request$: Observable<RsyncTask> = this.editingTask
      ? this.api.call('rsynctask.update', [this.editingTask.id, values as RsyncTaskUpdate])
      : this.api.call('rsynctask.create', [values as RsyncTaskUpdate]);

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Task created')
        : this.translate.instant('Task updated'),
      onError: (error: unknown): boolean => {
        this.errorHandler.handleValidationErrors(error, this.form, {
          remotehost: 'remotepath',
        });
        return true;
      },
    };
  };
}
