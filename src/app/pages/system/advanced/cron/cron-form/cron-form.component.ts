import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextCron } from 'app/helptext/system/cron-form';
import { Cronjob } from 'app/interfaces/cronjob.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';

@Component({
  selector: 'ix-cron-form',
  templateUrl: './cron-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxUserComboboxComponent,
    SchedulerComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class CronFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

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

  protected isLoading = signal(false);

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  readonly tooltips = {
    command: helptextCron.commandTooltip,
    user: helptextCron.userTooltip,
    schedule: helptextCron.crontabTooltip,
    stdout: helptextCron.stdoutTooltip,
    stderr: helptextCron.stderrTooltip,
  };

  private editingCron: Cronjob | undefined;

  /**
   * Row to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Absent for Add, and unused in the legacy SlideIn host (which
   * supplies the row via `slideInRef.getData()`).
   */
  readonly editCronjob = input<CronjobRow | undefined>(undefined);

  ngOnInit(): void {
    this.editingCron = this.slideInRef
      ? this.slideInRef.getData() as Cronjob | undefined
      : this.editCronjob();
    if (this.editingCron) {
      this.form.patchValue({
        ...this.editingCron,
        schedule: scheduleToCrontab(this.editingCron.schedule),
      });
    }
  }

  protected onSubmit(): void {
    const values = {
      ...this.form.getRawValue(),
      schedule: crontabToSchedule(this.form.getRawValue().schedule),
    };

    this.isLoading.set(true);
    let request$: Observable<unknown>;
    if (this.editingCron) {
      request$ = this.api.call('cronjob.update', [
        this.editingCron.id,
        values,
      ]);
    } else {
      request$ = this.api.call('cronjob.create', [values]);
    }

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Cron job created'));
        } else {
          this.snackbar.success(this.translate.instant('Cron job updated'));
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
