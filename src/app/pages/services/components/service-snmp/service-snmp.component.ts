import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextServiceSnmp } from 'app/helptext/services/components/service-snmp';
import { SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-snmp',
  templateUrl: './service-snmp.component.html',
  styleUrls: ['./service-snmp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceSnmpComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  isFormLoading = false;

  form = this.fb.group({
    location: [''],
    contact: ['', emailValidator()],
    community: ['', Validators.pattern(/^[\w_\-.\s]*$/)],

    v3: [false],
    v3_username: [''],
    v3_authtype: [''],
    v3_password: ['', [
      Validators.minLength(8),
      this.validation.validateOnCondition(
        () => this.isV3SupportEnabled,
        Validators.required,
      ),
    ]],
    v3_privproto: [''],
    v3_privpassphrase: ['', Validators.minLength(8)],

    options: [''],
    zilstat: [false],
    loglevel: [null as number | null],
  });

  readonly tooltips = {
    location: helptextServiceSnmp.location_tooltip,
    contact: helptextServiceSnmp.contact_tooltip,
    community: helptextServiceSnmp.community_tooltip,
    v3: helptextServiceSnmp.v3_tooltip,
    v3_username: helptextServiceSnmp.v3_username_tooltip,
    v3_authtype: helptextServiceSnmp.v3_authtype_tooltip,
    v3_password: helptextServiceSnmp.v3_password_tooltip,
    v3_privproto: helptextServiceSnmp.v3_privproto_tooltip,
    v3_privpassphrase: helptextServiceSnmp.v3_privpassphrase_tooltip,
    options: helptextServiceSnmp.options_tooltip,
    loglevel: helptextServiceSnmp.loglevel_tooltip,
  };

  readonly authtypeOptions$ = of(helptextServiceSnmp.v3_authtype_options);
  readonly privprotoOptions$ = of(helptextServiceSnmp.v3_privproto_options);
  readonly logLevelOptions$ = of(helptextServiceSnmp.loglevel_options);

  get isV3SupportEnabled(): boolean {
    return this.form?.value?.v3 || false;
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private validation: IxValidatorsService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;
    if (!values.v3) {
      values.v3_username = '';
      values.v3_password = '';
      values.v3_authtype = '';
      values.v3_privproto = null;
      values.v3_privpassphrase = '';
    }

    this.api.call('snmp.update', [values as SnmpConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close({ response: true, error: null });
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private loadCurrentSettings(): void {
    this.isFormLoading = true;
    this.api.call('snmp.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.isFormLoading = false;
        this.form.patchValue(config);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
