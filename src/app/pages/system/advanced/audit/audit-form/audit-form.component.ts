import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  EMPTY,
} from 'rxjs';
import {
  catchError, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { AuditConfig } from 'app/interfaces/audit/audit.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  selector: 'ix-audit-form',
  templateUrl: 'audit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class AuditFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemAuditWrite];

  isFormLoading = false;

  readonly form = this.fb.group({
    retention: [null as number, [Validators.required, Validators.min(1), Validators.max(30)]],
    reservation: [null as number, [Validators.required, Validators.min(0), Validators.max(100)]],
    quota: [null as number, [Validators.required, Validators.min(0), Validators.max(100)]],
    quota_fill_warning: [null as number, [Validators.required, Validators.min(5), Validators.max(80)]],
    quota_fill_critical: [null as number, [Validators.required, Validators.min(50), Validators.max(95)]],
  });

  readonly tooltips = {
    retention: helptext.retention_tooltip,
    reservation: helptext.reservation_tooltip,
    quota: helptext.quota_tooltip,
    quota_fill_warning: helptext.quota_fill_warning_tooltip,
    quota_fill_critical: helptext.quota_fill_critical_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private formErrorHandler: FormErrorHandlerService,
    private chainedRef: ChainedRef<unknown>,
  ) {}

  ngOnInit(): void {
    this.loadForm();
  }

  onSubmit(): void {
    const configUpdate = this.form.value as AuditConfig;
    this.isFormLoading = true;
    this.ws.call('audit.update', [configUpdate]).pipe(
      tap(() => {
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.chainedRef.close({ response: true, error: null });
      }),
      catchError((error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadForm(): void {
    this.isFormLoading = true;

    this.ws.call('audit.config').pipe(untilDestroyed(this))
      .subscribe({
        next: (auditConfig) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.form.patchValue({
            ...auditConfig,
          });
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }
}
