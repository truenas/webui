import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/system/cron-form';
import { Cronjob, CronjobUpdate } from 'app/interfaces/cronjob.interface';
import { UserComboboxProvider } from 'app/modules/ix-forms/classes/user-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cron-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingCron;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Cron Job')
      : this.translate.instant('Edit Cron Job');
  }

  form = this.fb.group({
    description: [''],
    command: ['', Validators.required],
    user: ['', Validators.required],
    schedule: [CronPresetValue.Daily as string, Validators.required],
    stdout: [true],
    stderr: [false],
    enabled: [true],
  });

  isLoading = false;

  readonly tooltips = {
    description: helptext.cron_description_tooltip,
    command: helptext.cron_command_tooltip,
    user: helptext.cron_user_tooltip,
    schedule: helptext.crontab_tooltip,
    stdout: helptext.cron_stdout_tooltip,
    stderr: helptext.cron_stderr_tooltip,
    enabled: helptext.cron_enabled_tooltip,
  };

  readonly userProvider = new UserComboboxProvider(this.userService);

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private userService: UserService,
    private slideInRef: IxSlideInRef<CronFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingCron: Cronjob,
  ) {}

  ngOnInit(): void {
    if (this.editingCron) {
      this.setCronForEdit();
    }
  }

  setCronForEdit(): void {
    this.form.patchValue({
      ...this.editingCron,
      schedule: scheduleToCrontab(this.editingCron.schedule),
    });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      schedule: crontabToSchedule(this.form.value.schedule),
    } as CronjobUpdate;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('cronjob.create', [values]);
    } else {
      request$ = this.ws.call('cronjob.update', [
        this.editingCron.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Cron job created'));
        } else {
          this.snackbar.success(this.translate.instant('Cron job updated'));
        }
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
