import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createSnmpForm(fb: FormBuilder, validation: IxValidatorsService) {
  return fb.group({
    location: [''],
    contact: ['', emailValidator()],
    community: ['', Validators.pattern(/^[\w_\-.\s]*$/)],

    v3: [false],
    v3_username: [''],
    v3_authtype: [''],
    v3_password: ['', [
      Validators.minLength(8),
      validation.validateOnCondition(
        // Read off the sibling control rather than the component, so the group can be built
        // outside it.
        (control) => Boolean(control.parent?.get('v3')?.value),
        Validators.required,
      ),
    ]],
    v3_privproto: [''],
    v3_privpassphrase: ['', Validators.minLength(8)],

    options: [''],
    zilstat: [false],
  });
}

/**
 * The form's own value shape, which is NOT `SnmpConfigUpdate`: the v3 controls are blanked (and
 * `v3_privproto` nulled) for the API in {@link ServiceSnmpComponent.handleSubmit}.
 */
type SnmpFormValue = ReturnType<ReturnType<typeof createSnmpForm>['getRawValue']>;

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
export class ServiceSnmpComponent extends IxFormHostForm<boolean, SnmpFormValue> implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private validation = inject(IxValidatorsService);
  private translate = inject(TranslateService);

  readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly InputType = InputType;

  protected readonly form = createSnmpForm(this.fb, this.validation);

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

  /** Drives the `@if` around the v3 credential fields; the validator reads the control directly. */
  protected readonly isV3SupportEnabled = toSignal(this.form.controls.v3.valueChanges, {
    initialValue: this.form.controls.v3.value,
  });

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('snmp.config'), (config) => this.form.patchValue(config));
  }

  // `allValues` is copied because it is blanked below.
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
      successMessage: this.translate.instant(serviceConfigSavedMessage),
    };
  };
}
