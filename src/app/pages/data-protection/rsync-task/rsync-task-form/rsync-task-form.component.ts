import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewContainerRef,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { Direction } from 'app/enums/direction.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/data-protection/resync/resync-form';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { Option } from 'app/interfaces/option.interface';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { portRangeValidator } from 'app/modules/ix-forms/validators/range-validation/range-validation';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { SshCredentialsNewOption } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard-data.interface';
import { FilesystemService } from 'app/services/filesystem.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

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
    ssh_keyscan: [false],
    remoteport: [22, portRangeValidator()],
    remotemodule: ['', this.validatorsService.validateOnCondition(
      (control) => control.parent && this.isModuleMode,
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
    ssh_credentials: [null as number | SshCredentialsNewOption],
  });

  isLoading = false;

  readonly helptext = helptext;

  readonly directions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly rsyncModes$ = of([
    { label: this.translate.instant('Module'), value: RsyncMode.Module },
    { label: this.translate.instant('SSH'), value: RsyncMode.Ssh },
  ]);

  readonly sshConnectModes$ = of([
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ]);

  readonly sshCredentialsOptions$ = new BehaviorSubject<Option[]>([]);

  readonly userProvider = new UserComboboxProvider(this.userService);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private filesystemService: FilesystemService,
    private snackbar: SnackbarService,
    private keychainCredentials: KeychainCredentialService,
    private matDialog: MatDialog,
    private validatorsService: IxValidatorsService,
    private slideInRef: IxSlideInRef<RsyncTaskFormComponent>,
    private viewContainerRef: ViewContainerRef,
    @Inject(SLIDE_IN_DATA) private editingTask: RsyncTask,
  ) {}

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
    this.loadSshConnectionsOptions();
    this.listenForNewSshConnection();

    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  setTaskForEdit(): void {
    this.form.patchValue({
      ...this.editingTask,
      schedule: scheduleToCrontab(this.editingTask.schedule),
      sshconnectmode: this.editingTask.ssh_credentials ? RsyncSshConnectMode.KeyChain : RsyncSshConnectMode.PrivateKey,
      ssh_credentials: this.editingTask.ssh_credentials?.id || null,
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
      delete values.ssh_keyscan;
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
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form, {
          remotehost: 'remotepath',
        });
        this.cdr.markForCheck();
      },
    });
  }

  private loadSshConnectionsOptions(): void {
    this.keychainCredentials.getSshCredentialsOptions()
      .pipe(untilDestroyed(this))
      .subscribe((options) => this.sshCredentialsOptions$.next(options));
  }

  private listenForNewSshConnection(): void {
    this.form.controls.ssh_credentials.valueChanges.pipe(
      filter((value) => value === SshCredentialsNewOption.New),
      switchMap(() => this.openSshConnectionDialog()),
      filter(Boolean),
      switchMap((newCredential): Observable<[KeychainSshCredentials, Option[]]> => {
        return this.keychainCredentials.getSshCredentialsOptions().pipe(
          map((options) => [newCredential, options]),
        );
      }),
      untilDestroyed(this),
    ).subscribe(([newCredential, sshConnections]) => {
      this.sshCredentialsOptions$.next(sshConnections);
      this.form.controls.ssh_credentials.setValue(newCredential.id);
    });
  }

  private openSshConnectionDialog(): Observable<KeychainSshCredentials> {
    return this.matDialog.open(SshConnectionFormComponent, {
      data: { dialog: true },
      width: '600px',
      panelClass: 'ix-overflow-dialog',
      viewContainerRef: this.viewContainerRef,
    }).afterClosed();
  }
}

