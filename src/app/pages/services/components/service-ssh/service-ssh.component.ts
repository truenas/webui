import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { SshSftpLogFacility, SshSftpLogLevel, SshWeakCipher } from 'app/enums/ssh.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-ssh';
import { SshConfigUpdate } from 'app/interfaces/ssh-config.interface';
import { numberValidator } from 'app/modules/entity/entity-form/validators/number-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './service-ssh.component.html',
  styleUrls: ['./service-ssh.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSshComponent implements OnInit {
  isFormLoading = false;
  isBasicMode = true;

  form = this.fb.group({
    tcpport: [null as number, numberValidator()],
    rootlogin: [false],
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
    rootlogin: helptext.ssh_rootlogin_tooltip,
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
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private router: Router,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('ssh.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialogService);
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
          this.router.navigate(['/services']);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }
}
