import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import {
  EMPTY,
} from 'rxjs';
import {
  catchError, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@Component({
  selector: 'ix-audit-form',
  templateUrl: 'audit-form.component.html',
  styleUrls: ['./audit-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class AuditFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAuditWrite];

  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);

  readonly form = this.fb.group({
    retention: [null as number | null, [Validators.required, Validators.min(1), Validators.max(30)]],
    reservation: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    quota: [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    quota_fill_warning: [null as number | null, [Validators.required, Validators.min(5), Validators.max(80)]],
    quota_fill_critical: [null as number | null, [Validators.required, Validators.min(50), Validators.max(95)]],
  }, {
    validators: [
      greaterThanFg(
        'quota_fill_critical',
        ['quota_fill_warning'],
        this.translate.instant('Quota Fill Critical must be greater than Quota Fill Warning.'),
      ),
    ],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly tooltips = {
    retention: helptext.retentionTooltip,
    reservation: helptext.reservationTooltip,
    quota: helptext.quotaTooltip,
    quota_fill_warning: helptext.quotaFillWarningTooltip,
    quota_fill_critical: helptext.quotaFillCriticalTooltip,
  };

  ngOnInit(): void {
    this.loadForm();
  }

  protected onSubmit(): void {
    const configUpdate = this.form.value;
    this.isFormLoading.set(true);
    this.api.call('audit.update', [configUpdate]).pipe(
      tap(() => {
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.isFormLoading.set(false);
        this.close(true);
      }),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private loadForm(): void {
    this.isFormLoading.set(true);

    this.api.call('audit.config').pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (auditConfig) => {
          this.isFormLoading.set(false);
          this.form.patchValue({
            ...auditConfig,
          });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
