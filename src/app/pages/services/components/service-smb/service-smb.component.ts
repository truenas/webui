import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { LogLevel } from 'app/enums/log-level.enum';
import { Role } from 'app/enums/role.enum';
import { SmbEncryption, smbEncryptionLabels } from 'app/enums/smb-encryption.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceSmb } from 'app/helptext/services/components/service-smb';
import { SmbConfigUpdate } from 'app/interfaces/smb-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-service-smb',
  templateUrl: './service-smb.component.html',
  styleUrls: ['./service-smb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxComboboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
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
    encryption: [SmbEncryption.Default],
  });

  readonly requiredRoles = [Role.SharingSmbWrite];
  readonly helptext = helptextServiceSmb;
  readonly tooltips = {
    netbiosname: helptextServiceSmb.cifs_srv_netbiosname_tooltip,
    netbiosalias: helptextServiceSmb.cifs_srv_netbiosalias_tooltip,
    workgroup: helptextServiceSmb.cifs_srv_workgroup_tooltip,
    description: helptextServiceSmb.cifs_srv_description_tooltip,
    enable_smb1: helptextServiceSmb.cifs_srv_enable_smb1_tooltip,
    ntlmv1_auth: helptextServiceSmb.cifs_srv_ntlmv1_auth_tooltip,
    unixcharset: helptextServiceSmb.cifs_srv_unixcharset_tooltip,
    loglevel: helptextServiceSmb.cifs_srv_loglevel_tooltip,
    syslog: helptextServiceSmb.cifs_srv_syslog_tooltip,
    localmaster: helptextServiceSmb.cifs_srv_localmaster_tooltip,
    guest: helptextServiceSmb.cifs_srv_guest_tooltip,
    filemask: helptextServiceSmb.cifs_srv_filemask_tooltip,
    dirmask: helptextServiceSmb.cifs_srv_dirmask_tooltip,
    admin_group: helptextServiceSmb.cifs_srv_admin_group_tooltip,
    bindip: helptextServiceSmb.cifs_srv_bindip_tooltip,
    aapl_extensions: helptextServiceSmb.cifs_srv_aapl_extensions_tooltip,
    multichannel: helptextServiceSmb.cifs_srv_multichannel_tooltip,
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
  readonly encryptionOptions$ = of(mapToOptions(smbEncryptionLabels, this.translate));

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
    private slideInRef: SlideInRef<ServiceSmbComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('smb.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
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
}
