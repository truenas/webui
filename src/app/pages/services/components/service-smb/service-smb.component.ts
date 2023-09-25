import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { LogLevel } from 'app/enums/log-level.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/services/components/service-smb';
import { SmbConfigUpdate } from 'app/interfaces/smb-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  templateUrl: './service-smb.component.html',
  styleUrls: ['./service-smb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSmbComponent implements OnInit {
  isFormLoading = false;
  isBasicMode = true;
  subscriptions: Subscription[] = [];

  form = this.fb.group({
    netbiosname: ['', [Validators.required, Validators.maxLength(15)]],
    netbiosalias: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((alias: string) => alias.length <= 15);
        },
        this.translate.instant('Aliases must be 15 characters or less.'),
      ),
    ]],
    workgroup: ['', [Validators.required]],
    description: ['', []],
    enable_smb1: [false, []],
    ntlmv1_auth: [false, []],
    unixcharset: ['', []],
    loglevel: [LogLevel.None, []],
    syslog: [false, []],
    localmaster: [false, []],
    guest: ['nobody', []],
    filemask: ['', []],
    dirmask: ['', []],
    admin_group: ['', [Validators.maxLength(120)]],
    bindip: [[] as string[], []],
    aapl_extensions: [false, []],
    multichannel: [false, []],
  });

  readonly helptext = helptext;
  readonly tooltips = {
    netbiosname: helptext.cifs_srv_netbiosname_tooltip,
    netbiosalias: helptext.cifs_srv_netbiosalias_tooltip,
    workgroup: helptext.cifs_srv_workgroup_tooltip,
    description: helptext.cifs_srv_description_tooltip,
    enable_smb1: helptext.cifs_srv_enable_smb1_tooltip,
    ntlmv1_auth: helptext.cifs_srv_ntlmv1_auth_tooltip,
    unixcharset: helptext.cifs_srv_unixcharset_tooltip,
    loglevel: helptext.cifs_srv_loglevel_tooltip,
    syslog: helptext.cifs_srv_syslog_tooltip,
    localmaster: helptext.cifs_srv_localmaster_tooltip,
    guest: helptext.cifs_srv_guest_tooltip,
    filemask: helptext.cifs_srv_filemask_tooltip,
    dirmask: helptext.cifs_srv_dirmask_tooltip,
    admin_group: helptext.cifs_srv_admin_group_tooltip,
    bindip: helptext.cifs_srv_bindip_tooltip,
    aapl_extensions: helptext.cifs_srv_aapl_extensions_tooltip,
    multichannel: helptext.cifs_srv_multichannel_tooltip,
  };

  readonly logLevelOptions$ = of([
    { label: this.translate.instant('None'), value: LogLevel.None },
    { label: this.translate.instant('Minimum'), value: LogLevel.Minimum },
    { label: this.translate.instant('Normal'), value: LogLevel.Normal },
    { label: this.translate.instant('Full'), value: LogLevel.Full },
    { label: this.translate.instant('Debug'), value: LogLevel.Debug },
  ]);
  readonly unixCharsetOptions$ = this.ws.call('smb.unixcharset_choices').pipe(choicesToOptions());
  readonly guestAccountOptions$ = this.ws.call('user.query').pipe(
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );
  readonly adminGroupProvider = new SimpleAsyncComboboxProvider(
    this.userService.groupQueryDsCache('', true).pipe(
      map((groups) => groups.map((group) => ({ label: group.group, value: group.group }))),
    ),
  );
  readonly bindIpAddressOptions$ = this.ws.call('smb.bindip_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private userService: UserService,
    private validatorsService: IxValidatorsService,
    private snackbar: SnackbarService,
    private slideInRef: IxSlideInRef<ServiceSmbComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('smb.config').pipe(untilDestroyed(this)).subscribe({
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
    const values: SmbConfigUpdate = this.form.value;

    this.isFormLoading = true;
    this.ws.call('smb.update', [values])
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
