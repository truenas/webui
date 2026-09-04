import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceSsh } from 'app/helptext/services/components/service-ssh';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/user-group-pickers/ix-group-chips.component';
import {
  advancedModeFooterAction, advancedModeSettingLabels, SidePanelFooterAction,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createSshForm(fb: NonNullableFormBuilder) {
  return fb.group({
    tcpport: [null as number | null],
    password_login_groups: [[] as string[]],
    passwordauth: [false],
    kerberosauth: [false],
    tcpfwd: [false],
    bindiface: [[] as string[]],
    compression: [false],
    sftp_log_level: [null as SshSftpLogLevel | null],
    sftp_log_facility: [null as SshSftpLogFacility | null],
    weak_ciphers: [[] as SshWeakCipher[]],
    options: [''],
  });
}

/**
 * The form's own value shape, which is NOT `SshConfigUpdate`: `tcpport` and the two SFTP log
 * controls are nullable here, and `sftp_log_level` is coerced to `''` for the API in
 * {@link ServiceSshComponent.handleSubmit}.
 */
type SshFormValue = ReturnType<ReturnType<typeof createSshForm>['getRawValue']>;

@Component({
  selector: 'ix-service-ssh',
  templateUrl: './service-ssh.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxGroupChipsComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class ServiceSshComponent extends IxFormHostForm<boolean, SshFormValue> implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);

  readonly requiredRoles = [Role.SshWrite];
  protected readonly InputType = InputType;

  protected readonly isAdvancedMode = signal(false);

  protected readonly form = createSshForm(this.fb);

  readonly tooltips = {
    tcpport: helptextServiceSsh.tcpportTooltip,
    password_login_groups: helptextServiceSsh.passwordLoginGroupsTooltip,
    passwordauth: helptextServiceSsh.passwordauthTooltip,
    kerberosauth: helptextServiceSsh.kerberosauthTooltip,
    tcpfwd: helptextServiceSsh.tcpfwdTooltip,
    bindiface: helptextServiceSsh.bindifaceTooltip,
    compression: helptextServiceSsh.compressionTooltip,
    sftp_log_level: helptextServiceSsh.sftpLogLevelTooltip,
    sftp_log_facility: helptextServiceSsh.sftpLogFacilityTooltip,
    weak_ciphers: helptextServiceSsh.weakCiphersTooltip,
    options: helptextServiceSsh.optionsTooltip,
  };

  // tn-select does not translate option labels, so translate up-front.
  readonly sftpLogLevelOptions = translateOptions(this.translate, helptextServiceSsh.sftpLogLevelOptions);
  readonly sftpLogFacilityOptions = translateOptions(this.translate, helptextServiceSsh.sftpLogFacilityOptions);
  readonly weakCiphersOptions = translateOptions(this.translate, helptextServiceSsh.weakCiphersOptions);

  readonly bindInterfaces$ = this.api.call('ssh.bindiface_choices').pipe(choicesToOptions());

  /** The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). */
  private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode, {
    labels: advancedModeSettingLabels,
  });

  get footerActions(): SidePanelFooterAction[] {
    return this.advancedToggle();
  }

  ngOnInit(): void {
    this.loadFormConfig(this.api.call('ssh.config'), (config) => this.form.patchValue(config));
  }

  // `allValues` is copied because it is mutated below.
  protected handleSubmit = ({ allValues }: FormSubmitEvent<SshFormValue>): SubmitResult => {
    const values = { ...allValues };
    // Clearing the tn-select empty option writes null; the API expects ''.
    values.sftp_log_level = values.sftp_log_level ?? ('' as SshSftpLogLevel);

    return {
      request$: this.api.call('ssh.update', [values]),
      successMessage: this.translate.instant(serviceConfigSavedMessage),
    };
  };
}
