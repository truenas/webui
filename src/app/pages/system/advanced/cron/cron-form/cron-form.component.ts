import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextCron } from 'app/helptext/system/cron-form';
import { Cronjob, CronjobUpdate } from 'app/interfaces/cronjob.interface';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-cron-form',
  templateUrl: './cron-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxComboboxComponent,
    SchedulerComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class CronFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemCronWrite];

  get isNew(): boolean {
    return !this.editingCron;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Cron Job')
      : this.translate.instant('Edit Cron Job');
  }

  form = this.fb.nonNullable.group({
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
    description: helptextCron.cron_description_tooltip,
    command: helptextCron.cron_command_tooltip,
    user: helptextCron.cron_user_tooltip,
    schedule: helptextCron.crontab_tooltip,
    stdout: helptextCron.cron_stdout_tooltip,
    stderr: helptextCron.cron_stderr_tooltip,
    enabled: helptextCron.cron_enabled_tooltip,
  };

  readonly userProvider = new UserComboboxProvider(this.userService);

  private editingCron: Cronjob | undefined;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private userService: UserService,
    public slideInRef: SlideInRef<Cronjob | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingCron = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingCron) {
      this.form.patchValue({
        ...this.editingCron,
        schedule: scheduleToCrontab(this.editingCron.schedule),
      });
    }
  }

  onSubmit(): void {
    const values = {
      ...this.form.getRawValue(),
      schedule: crontabToSchedule(this.form.getRawValue().schedule),
    } as CronjobUpdate;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.editingCron) {
      request$ = this.api.call('cronjob.update', [
        this.editingCron.id,
        values,
      ]);
    } else {
      request$ = this.api.call('cronjob.create', [values]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Cron job created'));
        } else {
          this.snackbar.success(this.translate.instant('Cron job updated'));
        }
        this.isLoading = false;
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
