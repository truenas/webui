import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  DirectoryServiceCredentialType,
  DirectoryServiceType,
} from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ActiveDirectoryConfigComponent } from './active-directory-config/active-directory-config.component';
import { CredentialConfigComponent } from './credential-config/credential-config.component';
import { IpaConfigComponent } from './ipa-config/ipa-config.component';
import { LdapConfigComponent } from './ldap-config/ldap-config.component';
import { DirectoryServiceValidationService } from './services/directory-service-validation.service';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-form',
  templateUrl: './directory-services-form.component.html',
  styleUrls: ['./directory-services-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TranslateModule,
    TestDirective,
    RequiresRolesDirective,
    CredentialConfigComponent,
    ActiveDirectoryConfigComponent,
    LdapConfigComponent,
    IpaConfigComponent,
  ],
})
export class DirectoryServicesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private validationService = inject(DirectoryServiceValidationService);
  slideInRef = inject<SlideInRef<DirectoryServicesConfig | undefined, boolean>>(SlideInRef);

  protected readonly previousConfig = signal<DirectoryServicesConfig | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  private readonly mainFormValid = signal(false);

  // Validation states are now managed by the validation service
  protected credentialData: DirectoryServiceCredential | null = null;
  protected preservedCredentialData: DirectoryServiceCredential | null = null;
  protected readonly DirectoryServiceType = DirectoryServiceType;

  protected readonly isFormValid = computed(() => {
    return this.validationService.calculateFormValidity(
      this.mainFormValid(),
      this.form.controls.service_type.value,
    );
  });

  private updateFormValidity(): void {
    this.mainFormValid.set(this.form.valid);
  }

  protected readonly form = this.fb.group({
    service_type: [null as DirectoryServiceType, Validators.required],
    enable: [false, Validators.required],
    enable_account_cache: [true, Validators.required],
    enable_dns_updates: [false, Validators.required],
    timeout: [30, [Validators.required, Validators.min(5), Validators.max(60)]],
    kerberos_realm: [null],
  });

  protected configurationData: DirectoryServicesUpdate['configuration'] = null;
  protected readonly activeDirectoryConfig = computed(
    () => this.previousConfig()?.configuration as ActiveDirectoryConfig,
  );

  protected readonly ldapConfig = computed(() => this.previousConfig()?.configuration as LdapConfig);
  protected readonly ipaConfig = computed(() => this.previousConfig()?.configuration as IpaConfig);

  protected configurationTypeOptions$: Observable<Option[]> = of([
    { label: 'Active Directory', value: DirectoryServiceType.ActiveDirectory },
    { label: 'LDAP', value: DirectoryServiceType.Ldap },
    { label: 'IPA', value: DirectoryServiceType.Ipa },
  ]);

  constructor() {
    const data = this.slideInRef.getData();
    if (data) {
      this.previousConfig.set(data);
    }
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.fillFormWithPreviousConfig();
    this.setupFormWatchers();
    this.updateFormValidity();
  }

  private getServiceTypeDisplayName(serviceType: DirectoryServiceType): string {
    // Use the same labels as defined in configurationTypeOptions$
    const typeMap = {
      [DirectoryServiceType.ActiveDirectory]: 'Active Directory',
      [DirectoryServiceType.Ldap]: 'LDAP',
      [DirectoryServiceType.Ipa]: 'IPA',
    };
    return this.translate.instant(typeMap[serviceType] || serviceType);
  }

  private fillFormWithPreviousConfig(): void {
    this.form.patchValue(this.previousConfig());
  }

  onCredentialDataChanged(credentialData: DirectoryServicesUpdate['credential']): void {
    this.credentialData = credentialData;
    this.updateFormValidity();
  }

  onCredentialValidityChanged(isValid: boolean): void {
    this.validationService.setCredentialValid(isValid);
    this.updateFormValidity();
  }

  onConfigurationDataChanged(configurationData: DirectoryServicesUpdate['configuration']): void {
    this.configurationData = configurationData;
    this.cdr.markForCheck();
  }

  onIpaValidityChanged(isValid: boolean): void {
    this.validationService.setIpaValid(isValid);
    this.updateFormValidity();
  }

  onLdapValidityChanged(isValid: boolean): void {
    this.validationService.setLdapValid(isValid);
    this.updateFormValidity();
  }

  onActiveDirectoryValidityChanged(isValid: boolean): void {
    this.validationService.setActiveDirectoryValid(isValid);
    this.updateFormValidity();
  }

  onKerberosRealmSuggested(suggestedRealm: string | null): void {
    if (suggestedRealm && !this.form.controls.kerberos_realm.value) {
      this.form.controls.kerberos_realm.setValue(suggestedRealm);
    } else if (!suggestedRealm) {
      this.form.controls.kerberos_realm.setValue(null);
    }
    this.cdr.markForCheck();
  }

  protected onSubmit(): void {
    // Clear any manual validation errors before submitting
    this.validationService.clearFormControlErrors(this.form);

    if (this.form.invalid) {
      return;
    }

    if (!this.isFormValid()) {
      return;
    }

    const formValue = this.form.value;
    const apiPayload = this.transformFormDataToApiPayload(formValue);

    this.isLoading.set(true);
    this.dialogService.jobDialog(
      this.api.job('directoryservices.update', [apiPayload]),
      { title: this.translate.instant('Updating Directory Services Configuration') },
    )
      .afterClosed()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.slideInRef.close({ response: true });
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form, this.getFieldsMap());
        },
      });
  }

  protected onClearConfig(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Clear Directory Services Configuration'),
      message: this.translate.instant('Directory service will be disabled and all settings will be lost. Are you sure you want to continue?'),
      buttonText: this.translate.instant('Clear'),
    }).pipe(
      untilDestroyed(this),
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.isLoading.set(true);
      this.dialogService.jobDialog(
        this.api.job('directoryservices.update', [{ enable: false, service_type: null } as DirectoryServicesUpdate]),
        { title: this.translate.instant('Clearing Directory Services Configuration') },
      )
        .afterClosed()
        .pipe(
          finalize(() => this.isLoading.set(false)),
          untilDestroyed(this),
        )
        .subscribe({
          next: () => {
            this.slideInRef.close({ response: true });
          },
          error: (error: unknown) => {
            this.errorHandler.showErrorModal(error);
          },
        });
    });
  }

  private getFieldsMap(): Record<string, string> {
    // Map backend field names to frontend form control names
    // NOTE: FormErrorHandlerService takes the last part of the field name (after the last dot)
    // So "directoryservices.update.credential.configuration.domain" becomes "domain"
    return {
      // Main form fields (last part of field name)
      service_type: 'service_type',
      enable: 'enable',
      enable_account_cache: 'enable_account_cache',
      enable_dns_updates: 'enable_dns_updates',
      timeout: 'timeout',
      kerberos_realm: 'kerberos_realm',

      // Active Directory configuration fields - map to service_type to show error on main form
      hostname: 'service_type',
      domain: 'service_type',
      use_default_domain: 'service_type',
      enable_trusted_domains: 'service_type',
      site: 'service_type',
      computer_account_ou: 'service_type',

      // Credential fields
      username: 'service_type',
      password: 'service_type',
      principal: 'service_type',

      // LDAP configuration fields
      server_urls: 'service_type',
      basedn: 'service_type',
      starttls: 'service_type',
      validate_certificates: 'service_type',
      schema: 'service_type',

      // IPA configuration fields
      ipa_server: 'service_type',
      ipa_domain: 'service_type',
    };
  }

  private setupFormWatchers(): void {
    // Watch for main form status changes (validity)
    this.form.statusChanges.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.updateFormValidity();
    });

    this.form.controls.service_type.valueChanges.pipe(
      debounceTime(300), // Add debounce to prevent rapid changes
      distinctUntilChanged(), // Only emit when value actually changes
      untilDestroyed(this),
    ).subscribe((serviceType) => {
      // Check if we're trying to change service type while the current service is enabled
      // This prevents data loss and ensures users understand they need to disable the service first
      const previousConfig = this.previousConfig();
      const currentServiceType = previousConfig?.service_type;
      const isCurrentServiceEnabled = previousConfig?.enable;

      if (isCurrentServiceEnabled && currentServiceType && serviceType !== currentServiceType) {
        // Show error dialog and revert the selection after user acknowledges
        this.dialogService.info(
          this.translate.instant('Directory Service Type Change Not Allowed'),
          this.translate.instant('The directory service is currently enabled and configured as {currentType}. To change to {newType}, first uncheck "Enable Service", save the configuration, then you can change the service type.', {
            currentType: this.getServiceTypeDisplayName(currentServiceType),
            newType: this.getServiceTypeDisplayName(serviceType),
          }),
        ).pipe(untilDestroyed(this)).subscribe(() => {
          // Revert to previous service type after user dismisses the dialog
          this.form.controls.service_type.setValue(currentServiceType, { emitEvent: false });
          this.cdr.markForCheck();
        });
        return;
      }

      // Always clear configuration data when service type changes
      this.configurationData = null;

      // Reset validation states for inactive service types to ensure proper form validation
      this.validationService.resetInactiveServiceValidation(serviceType);

      // Only clear credential data if switching to an incompatible service type
      if (this.credentialData && serviceType) {
        const currentCredentialType = this.credentialData.credential_type;
        const isLdapCredential = [
          DirectoryServiceCredentialType.LdapPlain,
          DirectoryServiceCredentialType.LdapAnonymous,
          DirectoryServiceCredentialType.LdapMtls,
        ].includes(currentCredentialType);

        const isKerberosCredential = [
          DirectoryServiceCredentialType.KerberosUser,
          DirectoryServiceCredentialType.KerberosPrincipal,
        ].includes(currentCredentialType);

        const isServiceTypeLdap = serviceType === DirectoryServiceType.Ldap;
        const isServiceTypeAdOrIpa = serviceType === DirectoryServiceType.ActiveDirectory
          || serviceType === DirectoryServiceType.Ipa;

        // Clear credential data if switching to incompatible service type
        if ((isLdapCredential && isServiceTypeAdOrIpa) || (isKerberosCredential && isServiceTypeLdap)) {
          // Preserve the credential data before clearing it, in case we switch back
          if (isKerberosCredential && isServiceTypeLdap) {
            this.preservedCredentialData = this.credentialData;
          } else if (isLdapCredential && isServiceTypeAdOrIpa) {
            this.preservedCredentialData = null; // LDAP credentials can't be restored to AD/IPA
          }
          this.credentialData = null;
        } else {
          this.preservedCredentialData = this.credentialData;
        }
      } else if (!serviceType) {
        // Only clear credential data if no service type is selected
        this.credentialData = null;
        this.preservedCredentialData = null;
      } else if (this.preservedCredentialData) {
        // When switching back to a compatible service type, restore preserved credential data
        this.credentialData = this.preservedCredentialData;
      }

      // Auto-check Enable Service when configuration type is selected
      if (serviceType) {
        this.form.controls.enable.setValue(true);
      }

      this.cdr.markForCheck();
    });
  }

  private transformFormDataToApiPayload(formValue: typeof this.form.value): DirectoryServicesUpdate {
    const payload: Partial<DirectoryServicesUpdate> = {
      service_type: this.mapConfigurationTypeToServiceType(formValue.service_type || ''),
      enable: formValue.enable ?? false,
      enable_account_cache: formValue.enable_account_cache ?? true,
      enable_dns_updates: formValue.enable_dns_updates ?? false,
      timeout: formValue.timeout ?? 60,
      force: false,
      credential: null,
      configuration: null,
    };

    // Only include kerberos_realm if it's not null/empty
    if (formValue.kerberos_realm) {
      payload.kerberos_realm = formValue.kerberos_realm as string;
    }

    if (this.credentialData) {
      payload.credential = this.credentialData;
    }

    if (formValue.service_type && this.configurationData) {
      payload.configuration = this.configurationData;
    }

    return payload as DirectoryServicesUpdate;
  }

  private mapConfigurationTypeToServiceType(configurationType: string): DirectoryServiceType | null {
    switch (configurationType as DirectoryServiceType) {
      case DirectoryServiceType.ActiveDirectory: return DirectoryServiceType.ActiveDirectory;
      case DirectoryServiceType.Ldap: return DirectoryServiceType.Ldap;
      case DirectoryServiceType.Ipa: return DirectoryServiceType.Ipa;
      default: return null;
    }
  }

  get selectedConfigurationType(): DirectoryServiceType | null {
    return this.form.controls.service_type.value;
  }

  protected getCredentialPrevious(): DirectoryServiceCredential {
    return this.previousConfig()?.credential;
  }
}
