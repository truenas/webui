import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { helptextReplication } from 'app/helptext/data-protection/replication/replication';
import { ReplicationCreate, ReplicationTask } from 'app/interfaces/replication-task.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-replication-schedule-section',
  templateUrl: './schedule-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    SchedulerComponent,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class ScheduleSectionComponent implements OnChanges {
  @Input() replication: ReplicationTask;

  form = this.formBuilder.group({
    auto: [true],
    schedule: [false],
    schedule_picker: [CronPresetValue.Daily as string],
    schedule_begin: ['00:00'],
    schedule_end: ['23:59'],
    only_matching_schedule: [false],
  });

  readonly timeOptions$ = of(this.taskService.getTimeOptions());

  protected readonly helptext = helptextReplication;
  protected readonly CronPresetValue = CronPresetValue;

  constructor(
    private formBuilder: FormBuilder,
    private taskService: TaskService,
  ) {}

  ngOnChanges(): void {
    if (this.replication) {
      this.setFormValues(this.replication);
    }
  }

  getPayload(): Partial<ReplicationCreate> {
    const values = this.form.value;

    const payload = {
      auto: values.auto,
    } as Partial<ReplicationCreate>;

    if (values.schedule) {
      payload.schedule = {
        ...crontabToSchedule(values.schedule_picker),
        begin: values.schedule_begin,
        end: values.schedule_end,
      };
      payload.only_matching_schedule = values.only_matching_schedule;
    } else {
      payload.schedule = null;
      payload.only_matching_schedule = false;
    }

    return payload;
  }

  private setFormValues(replication: ReplicationTask): void {
    this.form.patchValue({
      ...replication,
      schedule: Boolean(replication.schedule),
    });

    if (replication.schedule) {
      this.form.patchValue({
        schedule_picker: replication.schedule ? scheduleToCrontab(replication.schedule) : null,
        schedule_begin: replication.schedule?.begin || '00:00',
        schedule_end: replication.schedule?.end || '23:59',
      });
    }
  }
}
