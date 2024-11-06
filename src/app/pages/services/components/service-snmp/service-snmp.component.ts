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
import { helptextServiceSmart } from 'app/helptext/services/components/service-snmp';
import { SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

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
  protected readonly requiredRoles = [Role.FullAdmin];

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
    loglevel: [null as number],
  });

  readonly tooltips = {
    location: helptextServiceSmart.location_tooltip,
    contact: helptextServiceSmart.contact_tooltip,
    community: helptextServiceSmart.community_tooltip,
    v3: helptextServiceSmart.v3_tooltip,
    v3_username: helptextServiceSmart.v3_username_tooltip,
    v3_authtype: helptextServiceSmart.v3_authtype_tooltip,
    v3_password: helptextServiceSmart.v3_password_tooltip,
    v3_privproto: helptextServiceSmart.v3_privproto_tooltip,
    v3_privpassphrase: helptextServiceSmart.v3_privpassphrase_tooltip,
    options: helptextServiceSmart.options_tooltip,
    loglevel: helptextServiceSmart.loglevel_tooltip,
  };

  readonly authtypeOptions$ = of(helptextServiceSmart.v3_authtype_options);
  readonly privprotoOptions$ = of(helptextServiceSmart.v3_privproto_options);
  readonly logLevelOptions$ = of(helptextServiceSmart.loglevel_options);

  get isV3SupportEnabled(): boolean {
    return this.form?.value?.v3;
  }

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private validation: IxValidatorsService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private slideInRef: SlideInRef<ServiceSnmpComponent>,
  ) {}

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

    this.ws.call('snmp.update', [values as SnmpConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private loadCurrentSettings(): void {
    this.isFormLoading = true;
    this.ws.call('snmp.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.isFormLoading = false;
        this.form.patchValue(config);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
