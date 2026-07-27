import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextScrubForm } from 'app/helptext/data-protection/scrub/scrub-form';
import { CreateScrubTask, ScrubTask } from 'app/interfaces/pool-scrub.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  crontabToSchedule,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    SchedulerComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ScrubFormComponent extends SidePanelForm implements OnInit {
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(FormErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.PoolScrubWrite];
  protected readonly InputType = InputType;

  protected isLoading = signal(false);
  protected existingTask: ScrubTask | undefined;
  private poolId: number;

  /**
   * Params when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to carry
   * data). Unused in the legacy SlideIn host, which supplies them via `getData()`.
   */
  readonly scrubParams = input<ScrubFormParams | undefined>(undefined);

  get isNew(): boolean {
    return !this.existingTask;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Schedule Scrub')
      : this.translate.instant('Configure Scheduled Scrub');
  }

  readonly form = this.fb.nonNullable.group({
    threshold: [35, [Validators.min(0), Validators.required]],
    schedule: ['', Validators.required],
    enabled: [true],
  });

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected readonly helptextScrubForm = helptextScrubForm;

  ngOnInit(): void {
    const params = this.slideInRef
      ? this.slideInRef.getData() as ScrubFormParams
      : this.scrubParams();
    this.poolId = params.poolId;
    this.existingTask = params.existingScrubTask ?? undefined;
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

  protected onSubmit(): void {
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

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Scrub scheduled'));
        } else {
          this.snackbar.success(this.translate.instant('Scrub settings updated'));
        }
        this.isLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
