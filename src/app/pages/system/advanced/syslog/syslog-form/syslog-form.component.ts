import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  EMPTY, of, Subscription,
} from 'rxjs';
import {
  catchError, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced, helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SyslogConfig } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-syslog-form',
  templateUrl: 'syslog-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SyslogFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;
  subscriptions: Subscription[] = [];

  readonly form = this.fb.group({
    fqdn_syslog: [false],
    sysloglevel: [null as SyslogLevel],
    syslogserver: [''],
    syslog_transport: [null as SyslogTransport],
    syslog_tls_certificate: [null as string],
    syslog_tls_certificate_authority: [null as string],
    syslog_audit: [false],
  });

  readonly isTlsTransport$ = this.form.select((values) => values.syslog_transport === SyslogTransport.Tls);

  readonly tooltips = {
    fqdn_syslog: helptext.fqdn_tooltip,
    sysloglevel: helptext.sysloglevel.tooltip,
    syslogserver: helptext.syslogserver.tooltip,
    syslog_transport: helptext.syslog_transport.tooltip,
    syslog_tls_certificate: helptext.syslog_tls_certificate.tooltip,
    syslog: helptext.system_dataset_tooltip,
    syslog_audit: helptext.syslog_audit_tooltip,
  };

  readonly levelOptions$ = of(helptextSystemAdvanced.sysloglevel.options);
  readonly transportOptions$ = of(helptextSystemAdvanced.syslog_transport.options);
  readonly certificateOptions$ = this.ws.call('system.advanced.syslog_certificate_choices').pipe(
    choicesToOptions(),
  );

  readonly certificateAuthorityOptions$ = this.ws.call('system.advanced.syslog_certificate_authority_choices')
    .pipe(choicesToOptions());

  private syslogConfig: SyslogConfig;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private formErrorHandler: FormErrorHandlerService,
    private chainedRef: ChainedRef<SyslogConfig>,
  ) {
    this.syslogConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.form.controls.syslog_tls_certificate.enabledWhile(this.isTlsTransport$),
    );

    this.loadForm();
  }

  onSubmit(): void {
    const { ...values } = this.form.value;
    let configUpdate: Partial<AdvancedConfigUpdate> = {
      syslog_transport: values.syslog_transport,
      fqdn_syslog: values.fqdn_syslog,
      syslogserver: values.syslogserver,
      sysloglevel: values.sysloglevel,
      syslog_audit: values.syslog_audit,
    };

    if (values.syslog_transport === SyslogTransport.Tls) {
      configUpdate = {
        ...configUpdate,
        syslog_tls_certificate: parseInt(values.syslog_tls_certificate),
        syslog_tls_certificate_authority: parseInt(values.syslog_tls_certificate_authority),
      };
    }

    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [configUpdate]).pipe(
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
    this.form.patchValue({
      ...this.syslogConfig,
      syslog_tls_certificate: String(this.syslogConfig.syslog_tls_certificate),
      syslog_tls_certificate_authority: String(this.syslogConfig.syslog_tls_certificate_authority),
    });
  }
}
