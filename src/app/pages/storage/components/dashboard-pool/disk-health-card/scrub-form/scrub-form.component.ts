import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextScrubForm } from 'app/helptext/data-protection/scrub/scrub-form';
import { CreateScrubTask, ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

export interface ScrubFormParams {
  poolId: number;
  existingScrubTask: ScrubTask | null;
}

@UntilDestroy()
@Component({
  selector: 'ix-scrub-form',
  templateUrl: './scrub-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
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
export class ScrubFormComponent {
  protected readonly requiredRoles = [Role.PoolScrubWrite];

  protected isLoading = signal(false);
  protected existingTask: ScrubTask | undefined;
  private poolId: number;

  get isNew(): boolean {
    return !this.existingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Schedule Scrub')
      : this.translate.instant('Configure Scheduled Scrub');
  }

  form = this.fb.nonNullable.group({
    threshold: [35, [Validators.min(0), Validators.required]],
    schedule: ['', Validators.required],
    enabled: [true],
  });

  protected readonly helptextScrubForm = helptextScrubForm;

  constructor(
    private translate: TranslateService,
    private fb: FormBuilder,
    private api: ApiService,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    public slideInRef: SlideInRef<ScrubFormParams, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.poolId = this.slideInRef.getData().poolId;
    this.existingTask = this.slideInRef.getData().existingScrubTask;
    if (this.existingTask) {
      this.setTaskForEdit(this.existingTask);
    }
  }

  setTaskForEdit(editingTask: ScrubTask): void {
    this.form.patchValue({
      ...this.existingTask,
      schedule: scheduleToCrontab(editingTask.schedule),
    });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      pool: this.poolId,
      schedule: crontabToSchedule(this.form.getRawValue().schedule),
    };

    this.isLoading.set(true);
    let request$: Observable<unknown>;
    if (this.existingTask) {
      request$ = this.api.call('pool.scrub.update', [
        this.existingTask.id,
        values as CreateScrubTask,
      ]);
    } else {
      request$ = this.api.call('pool.scrub.create', [values as CreateScrubTask]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Scrub scheduled'));
        } else {
          this.snackbar.success(this.translate.instant('Scrub settings updated'));
        }
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
