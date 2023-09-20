import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/data-protection/scrub/scrub-form';
import { CreatePoolScrubTask, PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './scrub-task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScrubTaskFormComponent implements OnInit {
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

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: IxSlideInRef<ScrubTaskFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTask: PoolScrubTask,
  ) {}

  ngOnInit(): void {
    if (this.editingTask) {
      this.setTaskForEdit();
    }
  }

  setTaskForEdit(): void {
    this.form.patchValue({
      ...this.editingTask,
      schedule: scheduleToCrontab(this.editingTask.schedule),
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
      request$ = this.ws.call('pool.scrub.create', [values as CreatePoolScrubTask]);
    } else {
      request$ = this.ws.call('pool.scrub.update', [
        this.editingTask.id,
        values as CreatePoolScrubTask,
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
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
