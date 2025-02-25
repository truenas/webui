import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Direction } from 'app/enums/direction.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import { helptextRsyncForm } from 'app/helptext/data-protection/rsync/rsync-form';
import { newOption } from 'app/interfaces/option.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-rsync-task-form',
  templateUrl: './rsync-task-form.component.html',
  styleUrls: ['./rsync-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxExplorerComponent,
    IxComboboxComponent,
    IxSelectComponent,
    IxInputComponent,
    IxSlideToggleComponent,
    SshCredentialsSelectComponent,
    IxCheckboxComponent,
    SchedulerComponent,
    IxChipsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class RsyncTaskFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SnapshotTaskWrite];

  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Rsync Task')
      : this.translate.instant('Edit Rsync Task');
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

  isLoading = false;

  readonly helptext = helptextRsyncForm;

  readonly directions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly rsyncModes$ = of([
    { label: this.translate.instant('Module'), value: RsyncMode.Module },
    { label: 'SSH', value: RsyncMode.Ssh },
  ]);

  readonly sshConnectModes$ = of([
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ]);

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  private editingTask: RsyncTask | undefined;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private validatorsService: IxValidatorsService,
    public slideInRef: SlideInRef<RsyncTask | undefined, RsyncTask | false>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingTask = this.slideInRef.getData();
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

  onSubmit(): void {
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

    this.isLoading = true;
    let request$: Observable<RsyncTask>;
    if (this.editingTask) {
      request$ = this.api.call('rsynctask.update', [
        this.editingTask.id,
        values as RsyncTaskUpdate,
      ]);
    } else {
      request$ = this.api.call('rsynctask.create', [values as RsyncTaskUpdate]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: (task) => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.slideInRef.close({ response: task, error: null });
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form, {
          remotehost: 'remotepath',
        });
        this.cdr.markForCheck();
      },
    });
  }
}
