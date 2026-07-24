import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceSsh } from 'app/helptext/services/components/service-ssh';
import { SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { SidePanelFooterAction } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-service-ssh',
  templateUrl: './service-ssh.component.html',
  styleUrls: ['./service-ssh.component.scss'],
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
export class ServiceSshComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SshWrite];
  protected readonly InputType = InputType;

  protected readonly dataLoading = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<SshConfigUpdate> | null>(null);
  protected readonly isBasicMode = signal<boolean>(true);

  form = this.fb.group({
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

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). Re-read each
   * change detection, so the label flips with {@link isBasicMode}.
   */
  get footerActions(): SidePanelFooterAction[] {
    // Labels are extraction markers — the panel container pipes them through `translate`.
    return [{
      label: this.isBasicMode() ? T('Advanced Settings') : T('Basic Settings'),
      testId: 'toggle-advanced-options',
      onClick: () => this.onAdvancedSettingsToggled(),
    }];
  }

  ngOnInit(): void {
    this.dataLoading.set(true);
    this.api.call('ssh.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.initialFormSnapshot.set(this.form.getRawValue());
        this.dataLoading.set(false);
      },
      error: (error: unknown) => {
        this.dataLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  onAdvancedSettingsToggled(): void {
    this.isBasicMode.update((isBasic) => !isBasic);
  }

  protected handleSubmit = (): SubmitResult => {
    const values = this.form.value;
    // Clearing the tn-select empty option writes null; the API expects ''.
    values.sftp_log_level = values.sftp_log_level ?? ('' as SshSftpLogLevel);

    return {
      request$: this.api.call('ssh.update', [values]),
      successMessage: this.translate.instant('Service configuration saved'),
      closeWith: () => true,
    };
  };
}
