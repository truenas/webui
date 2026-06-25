import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceSsh } from 'app/helptext/services/components/service-ssh';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxGroupChipsComponent } from 'app/modules/forms/ix-forms/components/ix-group-chips/ix-group-chips.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxGroupChipsComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ServiceSshComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SshWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  isBasicMode = true;

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

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('ssh.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  onAdvancedSettingsToggled(): void {
    this.isBasicMode = !this.isBasicMode;
  }

  onSubmit(): void {
    const values = this.form.value;
    // Clearing the tn-select empty option writes null; the API expects ''.
    values.sftp_log_level = values.sftp_log_level ?? ('' as SshSftpLogLevel);

    this.isFormLoading.set(true);
    this.api.call('ssh.update', [values])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
