import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/services/components/service-ssh';
import { SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ChipsProvider } from 'app/modules/ix-forms/components/ix-chips/chips-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './service-ssh.component.html',
  styleUrls: ['./service-ssh.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSshComponent implements OnInit {
  isFormLoading = false;
  isBasicMode = true;

  groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  form = this.fb.group({
    tcpport: [null as number],
    password_login_groups: [null as string[]],
    passwordauth: [false],
    kerberosauth: [false],
    tcpfwd: [false],
    bindiface: [[] as string[]],
    compression: [false],
    sftp_log_level: [null as SshSftpLogLevel],
    sftp_log_facility: [null as SshSftpLogFacility],
    weak_ciphers: [[] as SshWeakCipher[]],
    options: [''],
  });

  readonly tooltips = {
    tcpport: helptext.ssh_tcpport_tooltip,
    password_login_groups: helptext.ssh_password_login_groups_tooltip,
    passwordauth: helptext.ssh_passwordauth_tooltip,
    kerberosauth: helptext.ssh_kerberosauth_tooltip,
    tcpfwd: helptext.ssh_tcpfwd_tooltip,
    bindiface: helptext.ssh_bindiface_tooltip,
    compression: helptext.ssh_compression_tooltip,
    sftp_log_level: helptext.ssh_sftp_log_level_tooltip,
    sftp_log_facility: helptext.ssh_sftp_log_facility_tooltip,
    weak_ciphers: helptext.ssh_weak_ciphers_tooltip,
    options: helptext.ssh_options_tooltip,
  };

  readonly sftpLogLevels$ = of(helptext.ssh_sftp_log_level_options);
  readonly sftpLogFacilities$ = of(helptext.ssh_sftp_log_facility_options);
  readonly sshWeakCiphers$ = of(helptext.ssh_weak_ciphers_options);
  readonly bindInterfaces$ = this.ws.call('ssh.bindiface_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private formErrorHandler: FormErrorHandlerService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private userService: UserService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<ServiceSshComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('ssh.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }

  onAdvancedSettingsToggled(): void {
    this.isBasicMode = !this.isBasicMode;
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('ssh.update', [values as SshConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
