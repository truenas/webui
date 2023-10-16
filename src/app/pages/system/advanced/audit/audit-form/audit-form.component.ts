import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Subscription,
} from 'rxjs';
import {
  catchError, tap,
} from 'rxjs/operators';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { AuditConfig } from 'app/interfaces/audit.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'audit-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditFormComponent implements OnInit {
  isFormLoading = false;
  subscriptions: Subscription[] = [];

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
    private slideInRef: IxSlideInRef<AuditFormComponent>,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private formErrorHandler: FormErrorHandlerService,
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
        this.slideInRef.close();
      }),
      catchError((error) => {
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
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
