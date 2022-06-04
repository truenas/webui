import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/data-protection/resync/resync-form';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { portRangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
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
    remotehost: ['', Validators.required],
    remoteport: [22, [portRangeValidator(), Validators.required]],
    remotemodule: ['', Validators.required],
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
    connectmode: [RsyncSshConnectMode.PrivateKey],
    ssh_credentials: [null as number],
  });

  isLoading = false;

  readonly helptext = helptext;

  readonly directions$ = of([
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ]);

  readonly rsyncModes$ = of([
    { label: 'Module', value: RsyncMode.Module },
    { label: 'SSH', value: RsyncMode.Ssh },
  ]);

  readonly connectModes$ = of([
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ]);

  readonly sshConnections$ = this.keychainCredentialService.getSshConnections().pipe(map((options) => {
    return [
      { label: this.translate.instant('Create New'), value: -1 },
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
  ) {}

  get isSshMode(): boolean {
    return this.form.value.mode === RsyncMode.Ssh;
  }

  get isSshConnectionPrivateMode(): boolean {
    return this.form.value.connectmode === RsyncSshConnectMode.PrivateKey;
  }

  ngOnInit(): void {
    this.form.controls.ssh_credentials.valueChanges.pipe(untilDestroyed(this)).subscribe((value: number) => {
      if (value === -1) {
        this.slideInService.open(SshConnectionFormComponent);
      }
    });
  }

  setTaskForEdit(task: RsyncTask): void {
    this.editingTask = task;
    this.form.patchValue({
      ...task,
      schedule: scheduleToCrontab(task.schedule),
      connectmode: task.ssh_credentials ? RsyncSshConnectMode.KeyChain : RsyncSshConnectMode.PrivateKey,
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
      if (values.connectmode === RsyncSshConnectMode.PrivateKey) {
        delete values.ssh_credentials;
      } else {
        delete values.remotehost;
        delete values.remoteport;
        delete values.remotepath;
        delete values.validate_rpath;
      }
    }
    delete values.connectmode;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('rsynctask.create', [values]);
    } else {
      request$ = this.ws.call('rsynctask.update', [
        this.editingTask.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
