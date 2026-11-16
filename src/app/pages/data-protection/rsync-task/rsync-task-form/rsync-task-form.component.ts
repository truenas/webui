import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import {
  form, hidden, required, validate,
} from '@angular/forms/signals';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent, TnSelectOption, TnSlideToggleComponent, TnFilePickerComponent,
} from '@truenas/ui-components';
import { omit } from 'lodash-es';
import { Observable, map } from 'rxjs';
import { Direction } from 'app/enums/direction.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { RsyncMode, RsyncSshConnectMode } from 'app/enums/rsync-mode.enum';
import { helptextRsyncForm } from 'app/helptext/data-protection/rsync/rsync-form';
import { newOption } from 'app/interfaces/option.interface';
import { RsyncTask, RsyncTaskUpdate, toRsyncTask } from 'app/interfaces/rsync-task.interface';
import { SshCredentialsSelectComponent } from 'app/modules/forms/custom-selects/ssh-credentials-select/ssh-credentials-select.component';
import { CreateDatasetActionPipe } from 'app/modules/forms/file-picker/create-dataset-action.pipe';
import { FilePickerSourcePipe } from 'app/modules/forms/file-picker/file-picker-source.pipe';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-user-combobox.component';
import { signalFormImports } from 'app/modules/forms/signal-forms/ix-signal-error-dismiss.directive';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { activeValue, patchModelValue, toFormModel } from 'app/modules/forms/signal-forms/signal-forms.utils';
import { validatePrincipalExists } from 'app/modules/forms/signal-forms/validate-principal-exists';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { FilesystemService } from 'app/services/filesystem.service';

interface RsyncTaskFormModel {
  path: string;
  user: string;
  direction: Direction | null;
  desc: string;
  mode: RsyncMode;
  remotehost: string | null;
  ssh_keyscan: boolean;
  remoteport: number | null;
  remotemodule: string;
  remotepath: string;
  validate_rpath: boolean;
  schedule: string;
  recursive: boolean;
  times: boolean;
  compress: boolean;
  archive: boolean;
  delete: boolean;
  quiet: boolean;
  preserveperm: boolean;
  preserveattr: boolean;
  delayupdates: boolean;
  extra: string[];
  enabled: boolean;
  sshconnectmode: RsyncSshConnectMode;
  ssh_credentials: number | typeof newOption | null;
}

const defaultModel: RsyncTaskFormModel = {
  path: '',
  user: '',
  direction: null,
  desc: '',
  mode: RsyncMode.Module,
  remotehost: '',
  ssh_keyscan: false,
  remoteport: 22,
  remotemodule: '',
  remotepath: mntPath,
  validate_rpath: true,
  schedule: '',
  recursive: true,
  times: true,
  compress: true,
  archive: false,
  delete: false,
  quiet: false,
  preserveperm: false,
  preserveattr: false,
  delayupdates: true,
  extra: [],
  enabled: true,
  sshconnectmode: RsyncSshConnectMode.PrivateKey,
  ssh_credentials: null,
};

const minPort = 1;
const maxPort = 65535;

@Component({
  selector: 'ix-rsync-task-form',
  templateUrl: './rsync-task-form.component.html',
  styleUrls: ['./rsync-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    signalFormImports,
    TnFilePickerComponent,
    FilePickerSourcePipe,
    CreateDatasetActionPipe,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnChipInputComponent,
    TnSlideToggleComponent,
    IxUserComboboxComponent,
    SshCredentialsSelectComponent,
    SchedulerComponent,
    TranslateModule,
  ],
  providers: [SignalFormErrors],
})
export class RsyncTaskFormComponent implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private serverErrors = inject(SignalFormErrors);
  private filesystemService = inject(FilesystemService);

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

  private readonly model = signal<RsyncTaskFormModel>({ ...defaultModel });

  protected readonly isModuleMode = computed(() => this.model().mode === RsyncMode.Module);
  private readonly isKeychainMode = computed(() => {
    return !this.isModuleMode() && this.model().sshconnectmode === RsyncSshConnectMode.KeyChain;
  });

  protected readonly isPrivateKeyMode = computed(() => !this.isModuleMode() && !this.isKeychainMode());

  /**
   * Fields a mode does not use are hidden rather than removed: they skip validation, so a required field
   * the user can no longer see cannot block Save, and `activeValue()` leaves them out of the payload.
   */
  protected readonly form = form(this.model, (path) => {
    required(path.path);
    required(path.user);
    validatePrincipalExists(path.user, { kind: 'user' });
    required(path.direction);
    required(path.schedule);

    hidden(path.remotemodule, { when: () => !this.isModuleMode() });
    required(path.remotemodule);

    hidden(path.remotehost, { when: () => this.isKeychainMode() });
    required(path.remotehost);

    hidden(path.sshconnectmode, { when: () => this.isModuleMode() });
    hidden(path.remotepath, { when: () => this.isModuleMode() });
    hidden(path.validate_rpath, { when: () => this.isModuleMode() });

    hidden(path.ssh_keyscan, { when: ({ valueOf }) => !this.isPrivateKeyMode() || !valueOf(path.remotehost) });

    hidden(path.remoteport, { when: () => !this.isPrivateKeyMode() });
    required(path.remoteport);
    validate(path.remoteport, ({ value }) => {
      const port = value();
      if (port === null || (Number.isInteger(port) && port >= minPort && port <= maxPort)) {
        return null;
      }
      return {
        kind: 'range',
        message: this.translate.instant(
          'The value is out of range. Enter a value between {min} and {max}.',
          { min: minPort, max: maxPort },
        ),
      };
    });

    hidden(path.ssh_credentials, { when: () => !this.isKeychainMode() });
    required(path.ssh_credentials);

    this.serverErrors.apply(path);
  });

  get isNew(): boolean {
    return !this.taskToEdit();
  }

  readonly helptext = helptextRsyncForm;

  // `tn-select` takes synchronous options, so these are plain arrays rather than the
  // observables the legacy select era needed.
  protected readonly directions: TnSelectOption<Direction>[] = [
    { label: this.translate.instant('Push'), value: Direction.Push },
    { label: this.translate.instant('Pull'), value: Direction.Pull },
  ];

  protected readonly rsyncModes: TnSelectOption<RsyncMode>[] = [
    { label: this.translate.instant('Module'), value: RsyncMode.Module },
    { label: ignoreTranslation('SSH'), value: RsyncMode.Ssh },
  ];

  protected readonly sshConnectModes: TnSelectOption<RsyncSshConnectMode>[] = [
    { label: this.translate.instant('SSH private key stored in user\'s home directory'), value: RsyncSshConnectMode.PrivateKey },
    { label: this.translate.instant('SSH connection from the keychain'), value: RsyncSshConnectMode.KeyChain },
  ];

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });

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
    return this.form().dirty();
  }

  ngOnInit(): void {
    const task = this.taskToEdit();
    if (task) {
      this.model.set(patchModelValue({ ...defaultModel }, toFormModel({
        ...task,
        schedule: scheduleToCrontab(task.schedule),
        sshconnectmode: task.ssh_credentials ? RsyncSshConnectMode.KeyChain : RsyncSshConnectMode.PrivateKey,
        ssh_credentials: task.ssh_credentials?.id || null,
      })));
    }
  }

  protected handleSubmit = (): SubmitResult => {
    // Hidden fields are already out: the remote fields of the other mode, and `sshconnectmode` in Module mode.
    const active = activeValue(this.form);
    const values = {
      ...omit(active, 'sshconnectmode'),
      schedule: crontabToSchedule(this.model().schedule),
      // Sent as null rather than left out, so an update that switches modes drops what the old mode used.
      ssh_credentials: this.isKeychainMode() ? active.ssh_credentials : null,
      ...(this.isKeychainMode() ? { remotehost: null, remoteport: null } : {}),
    } as RsyncTaskUpdate;

    const task = this.taskToEdit();
    const request$: Observable<RsyncTask> = task
      ? this.api.call('rsynctask.update', [task.id, values]).pipe(map(toRsyncTask))
      : this.api.call('rsynctask.create', [values]).pipe(map(toRsyncTask));

    return {
      request$,
      successMessage: this.isNew
        ? this.translate.instant('Task created')
        : this.translate.instant('Task updated'),
      onError: (error: unknown): boolean => {
        this.serverErrors.handleValidationErrors(error, { remotehost: 'remotepath' });
        return true;
      },
    };
  };
}
