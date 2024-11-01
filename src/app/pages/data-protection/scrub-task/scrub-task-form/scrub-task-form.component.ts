import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextScrubForm } from 'app/helptext/data-protection/scrub/scrub-form';
import { CreatePoolScrubTask, PoolScrubTask } from 'app/interfaces/pool-scrub.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-scrub-task-form',
  templateUrl: './scrub-task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    SchedulerComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ScrubTaskFormComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

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
    pool: helptextScrubForm.scrub_volume_tooltip,
    threshold: helptextScrubForm.scrub_threshold_tooltip,
    description: helptextScrubForm.scrub_description_tooltip,
    schedule: helptextScrubForm.scrub_picker_tooltip,
    enabled: helptextScrubForm.scrub_enabled_tooltip,
  };

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: SlideInRef<ScrubTaskFormComponent>,
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
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
