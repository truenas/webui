import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SmbEncryption, smbEncryptionLabels } from 'app/enums/smb-encryption.enum';
import { SmbProtocol } from 'app/enums/smb-protocol.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceSmb } from 'app/helptext/services/components/service-smb';
import { SmbConfigUpdate } from 'app/interfaces/smb-config.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';

interface BindIp {
  bindIp: string;
}

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  selector: 'ix-service-smb',
  templateUrl: './service-smb.component.html',
  styleUrls: ['./service-smb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IxListComponent,
    IxListItemComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceSmbComponent implements OnInit {
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private userService = inject(UserService);
  private validatorsService = inject(IxValidatorsService);
  private snackbar = inject(SnackbarService);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected isFormLoading = signal(false);
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
    debug: [false, []],
    syslog: [false, []],
    localmaster: [false, []],
    guest: ['nobody', []],
    filemask: ['', []],
    dirmask: ['', []],
    admin_group: ['', [Validators.maxLength(120)]],
    bindip: this.fb.array<BindIp>([]),
    aapl_extensions: [false, []],
    multichannel: [false, []],
    encryption: [SmbEncryption.Default],
  });

  searchProtocols = this.fb.control(false);


  protected readonly requiredRoles = [Role.SharingSmbWrite];
  readonly helptext = helptextServiceSmb;
  readonly tooltips = {
    netbiosname: helptextServiceSmb.netbiosnameTooltip,
    netbiosalias: helptextServiceSmb.netbiosaliasTooltip,
    workgroup: helptextServiceSmb.workgroupTooltip,
    description: helptextServiceSmb.descriptionTooltip,
    enable_smb1: helptextServiceSmb.enableSmb1Tooltip,
    ntlmv1_auth: helptextServiceSmb.ntlmv1AuthTooltip,
    unixcharset: helptextServiceSmb.unixcharsetTooltip,
    debug: helptextServiceSmb.debugTooltip,
    syslog: helptextServiceSmb.syslogTooltip,
    localmaster: helptextServiceSmb.localmasterTooltip,
    guest: helptextServiceSmb.guestTooltip,
    filemask: helptextServiceSmb.filemaskTooltip,
    dirmask: helptextServiceSmb.dirmaskTooltip,
    admin_group: helptextServiceSmb.adminGroupTooltip,
    bindip: helptextServiceSmb.bindipTooltip,
    aapl_extensions: helptextServiceSmb.aaplExtensionsTooltip,
    multichannel: helptextServiceSmb.multichannelTooltip,
    search_protocols: helptextServiceSmb.search_protocolsTooltip,
  };

  readonly unixCharsetOptions$ = this.api.call('smb.unixcharset_choices').pipe(choicesToOptions());
  readonly guestAccountOptions$ = this.api.call('user.query').pipe(
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );

  readonly adminGroupProvider = new SimpleAsyncComboboxProvider(
    this.userService.groupQueryDsCache('', true).pipe(
      map((groups) => groups.map((group) => ({ label: group.group, value: group.group }))),
    ),
  );

  readonly bindIpAddressOptions$ = combineLatest([
    this.api.call('smb.bindip_choices').pipe(choicesToOptions()),
    this.api.call('smb.config'),
  ]).pipe(
    map(([options, config]) => {
      return [
        ...new Set<string>([
          ...config.bindip,
          ...options.map((option) => `${option.value}`),
        ]),
      ].map((value) => ({ label: value, value }));
    }),
  );

  readonly encryptionOptions$ = of(mapToOptions(smbEncryptionLabels, this.translate));

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);

    this.api.call('smb.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        const searchProtocolEnabled = config.search_protocols?.[0] === SmbProtocol.Spotlight;
        config.bindip.forEach(() => this.addBindIp());
        this.form.patchValue({
          ...config,
          bindip: config.bindip.map((ip) => ({ bindIp: ip })),
        });
        this.searchProtocols.setValue(searchProtocolEnabled);
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  addBindIp(): void {
    this.form.controls.bindip.push(this.fb.group({
      bindIp: ['', [Validators.required]],
    }));
  }

  removeBindIp(index: number): void {
    this.form.controls.bindip.removeAt(index);
  }

  onAdvancedSettingsToggled(): void {
    this.isBasicMode = !this.isBasicMode;
  }

  onSubmit(): void {
    const form = this.form.value;
    const searchProtocols = this.searchProtocols.value ? [SmbProtocol.Spotlight] : [];

    const values: SmbConfigUpdate = {
      ...form,
      search_protocols: searchProtocols,
      bindip: this.form.value.bindip.map((value) => value.bindIp),
    };

    this.isFormLoading.set(true);
    this.api.call('smb.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
