import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextCron } from 'app/helptext/system/cron-form';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';

@Component({
  selector: 'ix-cron-form',
  templateUrl: './cron-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxUserComboboxComponent,
    SchedulerComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class CronFormComponent extends IxFormHostForm {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  protected readonly requiredRoles = [Role.SystemCronWrite];

  form = this.fb.nonNullable.group({
    description: [''],
    command: ['', Validators.required],
    user: ['', Validators.required],
    schedule: [CronPresetValue.Daily as string, Validators.required],
    stdout: [true],
    stderr: [false],
    enabled: [true],
  });

  readonly tooltips = {
    command: helptextCron.commandTooltip,
    user: helptextCron.userTooltip,
    schedule: helptextCron.crontabTooltip,
    stdout: helptextCron.stdoutTooltip,
    stderr: helptextCron.stderrTooltip,
  };

  /** Row to edit, supplied by the `<tn-side-panel>` host. Absent for Add. */
  readonly editCronjob = input<CronjobRow | undefined>(undefined);

  /** The row carries `schedule` as a crontab object; the form edits it as a crontab string. */
  protected transformEditCronjob = (data: unknown): Record<string, unknown> => {
    const cronjob = data as CronjobRow;
    return { ...cronjob, schedule: scheduleToCrontab(cronjob.schedule) };
  };

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const rawValues = this.form.getRawValue();
    const values = {
      ...rawValues,
      schedule: crontabToSchedule(rawValues.schedule),
    };
    const editingCron = this.editCronjob();

    return {
      request$: editingCron
        ? this.api.call('cronjob.update', [editingCron.id, values])
        : this.api.call('cronjob.create', [values]),
      successMessage: event.isEdit
        ? this.translate.instant('Cron job updated')
        : this.translate.instant('Cron job created'),
    };
  };
}
