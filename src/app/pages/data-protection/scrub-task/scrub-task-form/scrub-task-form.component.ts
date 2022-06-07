import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/data-protection/scrub/scrub-form';
import { PoolScrub } from 'app/interfaces/pool-scrub.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './scrub-task-form.component.html',
  styleUrls: ['./scrub-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubTaskFormComponent {
  get isNew(): boolean {
    return !this.editingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Scrub Task')
      : this.translate.instant('Edit Scrub Task');
  }

  form = this.fb.group({
    pool: [null as number, Validators.required],
    threshold: [35, [Validators.min(0), Validators.required]],
    description: [''],
    schedule: ['', Validators.required],
    enabled: [true],
  });

  isLoading = false;

  poolOptions$ = this.ws.call('pool.query').pipe(
    map((pools) => {
      return pools.map((pool) => ({ label: pool.name, value: pool.id }));
    }),
  );

  readonly tooltips = {
    pool: helptext.scrub_volume_tooltip,
    threshold: helptext.scrub_threshold_tooltip,
    description: helptext.scrub_description_tooltip,
    schedule: helptext.scrub_picker_tooltip,
    enabled: helptext.scrub_enabled_tooltip,
  };

  private editingTask: PoolScrub;

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  setTaskForEdit(task: PoolScrub): void {
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

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('pool.scrub.create', [values]);
    } else {
      request$ = this.ws.call('pool.scrub.update', [
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
