import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SmbEncryption, smbEncryptionLabels } from 'app/enums/smb-encryption.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceSmb } from 'app/helptext/services/components/service-smb';
import { SmbConfigUpdate, smbSearchSpotlight } from 'app/interfaces/smb-config.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
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
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

interface BindIp {
  bindIp: string;
}

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
  private truenasConnectService = inject(TruenasConnectService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected isFormLoading = signal(false);

  protected isEnterprise = toSignal(this.store$.select(selectIsEnterprise), { initialValue: false });

  protected isTruenasConnectConfigured = computed(() => {
    const config = this.truenasConnectService.config();
    return config?.status === TruenasConnectStatus.Configured;
  });

  protected isSpotlightEnabled = computed(() => {
    return this.isEnterprise() || this.isTruenasConnectConfigured();
  });

  protected shouldShowTruenasConnectNotice = computed(() => {
    return !this.isEnterprise() && !this.isTruenasConnectConfigured();
  });

  /**
   * Reactively enable/disable the Spotlight checkbox based on TrueNAS Connect configuration
   * and Enterprise status. On non-Enterprise systems, Spotlight requires TrueNAS Connect.
   */
  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    // Set up debounced validation for admin_group field
    this.setupAdminGroupValidation();

    effect(() => {
      const isEnabled = this.isSpotlightEnabled();
      if (isEnabled) {
        this.form.controls.spotlight_search.enable();
      } else {
        this.form.controls.spotlight_search.disable();
      }
    });
  }

  protected isBasicMode = true;

  /**
   * Set up debounced validation for the admin_group field.
   * Listens to value changes and validates the group exists after user stops typing.
   * Debounces requests to avoid excessive API calls during typing.
   */
  private setupAdminGroupValidation(): void {
    this.form.controls.admin_group.valueChanges.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      switchMap((groupName: string) => {
        const trimmedName = groupName?.trim();

        // Allow empty values - not a required field
        if (!trimmedName) {
          return of({ groupName: trimmedName, error: null as Record<string, unknown> | null });
        }

        // Validate that the group exists
        return this.userService.getGroupByName(trimmedName).pipe(
          map(() => ({ groupName: trimmedName, error: null as Record<string, unknown> | null })),
          catchError(() => {
            const errorMessage = this.validatorsService.makeErrorMessage(
              'groupNotFound',
              this.translate.instant(
                'Group "{group}" not found. Please verify the group name.',
                { group: trimmedName },
              ),
            );
            return of({ groupName: trimmedName, error: errorMessage as Record<string, unknown> });
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    )
      // ESLint rule doesn't recognize takeUntilDestroyed with object notation subscribe
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
      .subscribe(({ error }) => {
        // Manually set the validation error on the control
        if (error) {
          this.form.controls.admin_group.setErrors(error);
        } else {
          this.form.controls.admin_group.setErrors(null);
        }
      });
  }

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
    spotlight_search: [false, []],
  });

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
    spotlight_search: helptextServiceSmb.spotlightSearchTooltip,
  };

  readonly unixCharsetOptions$ = this.api.call('smb.unixcharset_choices').pipe(choicesToOptions());
  readonly guestAccountOptions$ = this.api.call('user.query').pipe(
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );

  readonly adminGroupProvider = new GroupComboboxProvider(this.userService);

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

  ngOnInit(): void {
    this.isFormLoading.set(true);

    // ESLint rule doesn't recognize takeUntilDestroyed with object notation subscribe
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    this.api.call('smb.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        const searchProtocolEnabled = config.search_protocols.includes(smbSearchSpotlight);
        config.bindip.forEach(() => this.addBindIp());
        this.form.patchValue({
          ...config,
          spotlight_search: searchProtocolEnabled,
          bindip: config.bindip.map((ip) => ({ bindIp: ip })),
        });
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

  protected openTruenasConnectModal(): void {
    this.truenasConnectService.openStatusModal();
  }

  protected onTruenasConnectLinkKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault(); // Prevents page scroll on Space
    this.openTruenasConnectModal();
  }

  protected onSubmit(): void {
    const { spotlight_search: spotlightSearch, ...formValues } = this.form.value;
    const values: SmbConfigUpdate = {
      ...formValues,
      search_protocols: spotlightSearch ? [smbSearchSpotlight] : [],
      bindip: this.form.value.bindip.map((value) => value.bindIp),
    };

    this.isFormLoading.set(true);
    this.api.call('smb.update', [values])
      .pipe(takeUntilDestroyed(this.destroyRef))
      // ESLint rule doesn't recognize takeUntilDestroyed with object notation subscribe
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
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
