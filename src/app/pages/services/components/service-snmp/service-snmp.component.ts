import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { helptextServiceSnmp } from 'app/helptext/services/components/service-snmp';
import { SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
  private errorHandler = inject(ErrorHandlerService);
  private validation = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly InputType = InputType;

  protected readonly dataLoading = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<SnmpConfigUpdate> | null>(null);

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
    loglevel: helptextServiceSnmp.loglevelTooltip,
  };

  readonly authtypeOptions = helptextServiceSnmp.v3.authTypeOptions;
  readonly privprotoOptions = helptextServiceSnmp.v3.privprotoOptions;
  // tn-select does not translate option labels, so translate up-front.
  readonly logLevelOptions = translateOptions(this.translate, helptextServiceSnmp.loglevelOptions);

  get isV3SupportEnabled(): boolean {
    return this.form?.value?.v3 || false;
  }

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  protected handleSubmit = (): SubmitResult => {
    const values = this.form.value;
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
      closeWith: () => true,
    };
  };

  private loadCurrentSettings(): void {
    this.dataLoading.set(true);
    this.api.call('snmp.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        this.dataLoading.set(false);
        this.form.patchValue(config);
        this.initialFormSnapshot.set(this.form.getRawValue());
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.dataLoading.set(false);
      },
    });
  }
}
