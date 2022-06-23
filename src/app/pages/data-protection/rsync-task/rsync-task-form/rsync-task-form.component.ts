import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { Direction } from 'app/enums/direction.enum';
import { RsyncMode } from 'app/enums/rsync-mode.enum';
import helptext from 'app/helptext/data-protection/resync/resync-form';
import { RsyncTask, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { portRangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { UserService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './rsync-task-form.component.html',
  styleUrls: ['./rsync-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncTaskFormComponent {
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
    remotehost: ['', Validators.required],
    mode: [RsyncMode.Module],
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
  ) {}

  get isSshMode(): boolean {
    return this.form.value.mode === RsyncMode.Ssh;
  }

  setTaskForEdit(task: RsyncTask): void {
    this.editingTask = task;
    this.form.patchValue({
      ...task,
      schedule: scheduleToCrontab(task.schedule),
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
    } else {
      delete values.remotemodule;
    }

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
