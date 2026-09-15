import {
  ChangeDetectionStrategy, Component, OnInit, input, inject,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextScrubForm } from 'app/helptext/data-protection/scrub/scrub-form';
import { CreateScrubTask, ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ApiService } from 'app/modules/websocket/api.service';

export interface ScrubFormParams {
  poolId: number;
  existingScrubTask: ScrubTask | null;
}

@Component({
  selector: 'ix-scrub-form',
  templateUrl: './scrub-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    SchedulerComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class ScrubFormComponent extends IxFormHostForm implements OnInit {
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  /** Read by the hosting `FormSidePanelContainerComponent` to gate its Save action. */
  readonly requiredRoles = [Role.PoolScrubWrite];
  protected readonly InputType = InputType;

  protected existingTask: ScrubTask | undefined;
  private poolId: number;

  /** Params supplied by the `<tn-side-panel>` host. */
  readonly scrubParams = input.required<ScrubFormParams>();

  protected readonly form = this.fb.nonNullable.group({
    threshold: [35, [Validators.min(0), Validators.required]],
    schedule: ['', Validators.required],
    enabled: [true],
  });

  protected readonly helptextScrubForm = helptextScrubForm;

  ngOnInit(): void {
    const params = this.scrubParams();
    this.poolId = params.poolId;
    this.existingTask = params.existingScrubTask ?? undefined;
    if (this.existingTask) {
      this.setTaskForEdit(this.existingTask);
    }
  }

  private setTaskForEdit(editingTask: ScrubTask): void {
    this.form.patchValue({
      threshold: editingTask.threshold,
      enabled: editingTask.enabled,
      schedule: scheduleToCrontab(editingTask.schedule),
    });
  }

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const values = {
      ...this.form.value,
      pool: this.poolId,
      schedule: crontabToSchedule(this.form.getRawValue().schedule),
    } as CreateScrubTask;
    const existingTask = this.existingTask;

    return {
      request$: existingTask
        ? this.api.call('pool.scrub.update', [existingTask.id, values])
        : this.api.call('pool.scrub.create', [values]),
      successMessage: event.isEdit
        ? this.translate.instant('Scrub settings updated')
        : this.translate.instant('Scrub scheduled'),
    };
  };
}
