import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/data-protection/resync/resync-form';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { portRangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { KeychainCredentialService, UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './rsync-task-form.component.html',
  styleUrls: ['./rsync-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncTaskFormComponent implements OnInit {
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
    direction: [null as Direction, Validators.required],
    desc: [''],
    mode: [RsyncMode.Module],
    remotehost: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && this.isModuleMode,
      Validators.required,
    )],
    remoteport: [22, portRangeValidator()],
    remotemodule: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && this.isModuleMode,
      Validators.required,
    )],
    remotepath: ['/mnt'],
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
    ssh_credentials: [null as number],
  });

  isLoading = false;
  sshCredentials: KeychainSshCredentials[];

  readonly helptext = helptext;

  readonly directions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly rsyncModes$ = of([
    { label: 'Module', value: RsyncMode.Module },
    { label: 'SSH', value: RsyncMode.Ssh },
  ]);

  readonly sshConnectModes$ = of([
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ]);

  sshConnections$ = this.keychainCredentialService.getSshConnections().pipe(map((options) => {
    this.sshCredentials = options;
    return [
      { label: this.translate.instant('Create New'), value: '' },
      ...options.map((option) => ({ label: option.name, value: option.id })),
    ];
  }));

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  private editingTask: RsyncTask;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private filesystemService: FilesystemService,
    protected keychainCredentialService: KeychainCredentialService,
    protected matDialog: MatDialog,
    private validatorsService: IxValidatorsService,
  ) {}

  get isModuleMode(): boolean {
    return this.form.value.mode === RsyncMode.Module;
  }

  get isSshConnectionPrivateMode(): boolean {
    return this.form.value.sshconnectmode === RsyncSshConnectMode.PrivateKey;
  }

  ngOnInit(): void {
    this.form.controls.ssh_credentials.valueChanges.pipe(untilDestroyed(this)).subscribe((value: number | '') => {
      if (value === '') {
        const dialogRef = this.matDialog.open(SshConnectionFormComponent, {
          data: { dialog: true },
          width: '600px',
          panelClass: 'ix-overflow-dialog',
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
          this.keychainCredentialService.getSshConnections().pipe(untilDestroyed(this)).subscribe((credentials) => {
            const newCredential = credentials.find((credential) => {
              return !this.sshCredentials.find((existingCredential) => existingCredential.id === credential.id);
            });

            if (!newCredential) {
              this.form.controls.ssh_credentials.setValue(null);
              return;
            }

            this.sshConnections$ = of([
              { label: this.translate.instant('Create New'), value: '' },
              ...credentials.map((credential) => ({ label: credential.name, value: credential.id })),
            ]);
            this.form.controls.ssh_credentials.setValue(newCredential.id);
            this.sshCredentials = credentials;
          });
        });
      }
    });
  }

  setTaskForEdit(task: RsyncTask): void {
    this.editingTask = task;
    this.form.patchValue({
      ...task,
      schedule: scheduleToCrontab(task.schedule),
      sshconnectmode: task.ssh_credentials ? RsyncSshConnectMode.KeyChain : RsyncSshConnectMode.PrivateKey,
      ssh_credentials: task.ssh_credentials?.id || null,
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
      delete values.ssh_credentials;
    } else {
      delete values.remotemodule;
      if (values.sshconnectmode === RsyncSshConnectMode.PrivateKey) {
        values.ssh_credentials = null;
      } else {
        values.remotehost = null;
        values.remoteport = null;
      }
    }
    delete values.sshconnectmode;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('rsynctask.create', [values as RsyncTaskUpdate]);
    } else {
      request$ = this.ws.call('rsynctask.update', [
        this.editingTask.id,
        values as RsyncTaskUpdate,
      ]);
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
