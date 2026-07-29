import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextServiceSnmp } from 'app/helptext/services/components/service-snmp';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ApiService } from 'app/modules/websocket/api.service';

/**
 * The form's own value shape, which is NOT `SnmpConfigUpdate`: the v3 controls are blanked (and
 * `v3_privproto` nulled) for the API in {@link ServiceSnmpComponent.handleSubmit}.
 */
type SnmpFormValue = ReturnType<ServiceSnmpComponent['form']['getRawValue']>;

@Component({
  selector: 'ix-service-snmp',
  templateUrl: './service-snmp.component.html',
  styleUrls: ['./service-snmp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class ServiceSnmpComponent extends IxFormHostForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private validation = inject(IxValidatorsService);
  private translate = inject(TranslateService);

  readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly InputType = InputType;

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
  });

  readonly tooltips = {
    location: helptextServiceSnmp.locationTooltip,
    contact: helptextServiceSnmp.contactTooltip,
    community: helptextServiceSnmp.communityTooltip,
    v3: helptextServiceSnmp.v3.tooltip,
    v3_username: helptextServiceSnmp.v3.usernameTooltip,
    v3_authtype: helptextServiceSnmp.v3.authTypeTooltip,
    v3_password: helptextServiceSnmp.v3.passwordTooltip,
    v3_privproto: helptextServiceSnmp.v3.privprotoTooltip,
    v3_privpassphrase: helptextServiceSnmp.v3.privpassphraseTooltip,
    options: helptextServiceSnmp.optionsTooltip,
  };

  readonly authtypeOptions = helptextServiceSnmp.v3.authTypeOptions;
  readonly privprotoOptions = helptextServiceSnmp.v3.privprotoOptions;

  get isV3SupportEnabled(): boolean {
    return this.form?.value?.v3 || false;
  }

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('snmp.config'), (config) => this.form.patchValue(config));
  }

  // Built from `allValues` (the wrapper's own `getRawValue()` snapshot) rather than re-reading the
  // form, so any future `preSubmit` transform is honoured. Copied because it is blanked below.
  protected handleSubmit = ({ allValues }: FormSubmitEvent<SnmpFormValue>): SubmitResult => {
    const values = { ...allValues };
    // Clearing the tn-select empty option writes null; the API expects ''.
    values.v3_authtype = values.v3_authtype ?? '';
    if (!values.v3) {
      values.v3_username = '';
      values.v3_password = '';
      values.v3_authtype = '';
      values.v3_privproto = null;
      values.v3_privpassphrase = '';
    }

    return {
      request$: this.api.call('snmp.update', [values]),
      successMessage: this.translate.instant('Service configuration saved'),
    };
  };
}
