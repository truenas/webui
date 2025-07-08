import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import {
  DirectoryServiceType,
} from 'app/enums/directory-services.enum';
import { Role } from 'app/enums/role.enum';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ActiveDirectoryConfigComponent } from './active-directory-config/active-directory-config.component';
import { CredentialConfigComponent } from './credential-config/credential-config.component';
import { IpaConfigComponent } from './ipa-config/ipa-config.component';
import { LdapConfigComponent } from './ldap-config/ldap-config.component';

@UntilDestroy()
@Component({
  selector: 'ix-directory-services-config-form',
  templateUrl: './directory-services-config-form.component.html',
  styleUrls: ['./directory-services-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    CredentialConfigComponent,
    ActiveDirectoryConfigComponent,
    LdapConfigComponent,
    IpaConfigComponent,
  ],
})
export class DirectoryServicesConfigFormComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  protected form = this.fb.group({
    // Basic configuration - DirectoryServicesConfigResponse non-nullable fields
    configuration_type: [null, Validators.required], // user selects AD, LDAP, or IPA
    enable: [false, Validators.required], // boolean - non-nullable
    enable_account_cache: [true, Validators.required], // boolean - non-nullable
    enable_dns_updates: [false, Validators.required], // boolean - non-nullable
    timeout: [30, [Validators.required, Validators.min(1), Validators.max(40)]], // max 40 seconds
    kerberos_realm: [null], // nullable
  });

  // Store refined sub-component data
  protected credentialData: DirectoryServicesUpdate['credential'] = null;
  protected configurationData: DirectoryServicesUpdate['configuration'] = null;

  protected configurationTypeOptions$: Observable<Option[]> = of([
    { label: 'Active Directory', value: DirectoryServiceType.ActiveDirectory },
    { label: 'LDAP', value: DirectoryServiceType.Ldap },
    { label: 'IPA', value: DirectoryServiceType.Ipa },
  ]);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<DirectoryServicesConfigFormComponent | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.setupFormWatchers();
  }

  // Handle sub-component refined data changes
  onCredentialDataChanged(credentialData: DirectoryServicesUpdate['credential']): void {
    this.credentialData = credentialData;
    this.cdr.markForCheck();
  }

  onConfigurationDataChanged(configurationData: DirectoryServicesUpdate['configuration']): void {
    this.configurationData = configurationData;
    this.cdr.markForCheck();
  }

  onKerberosRealmSuggested(suggestedRealm: string | null): void {
    // Auto-populate Kerberos realm if it's currently empty
    if (suggestedRealm && !this.form.controls.kerberos_realm.value) {
      this.form.controls.kerberos_realm.setValue(suggestedRealm);
    } else if (!suggestedRealm) {
      // Clear realm if domain is cleared
      this.form.controls.kerberos_realm.setValue(null);
    }
    this.cdr.markForCheck();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const formValue = this.form.value;
    const apiPayload = this.transformFormDataToApiPayload(formValue);

    this.isLoading.set(true);
    this.api.job('directoryservices.update', [apiPayload]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private setupFormWatchers(): void {
    // Watch configuration type changes to clear form data when switching
    this.form.controls.configuration_type.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      // Clear sub-component data when configuration type changes
      this.credentialData = null;
      this.configurationData = null;
      this.cdr.markForCheck();
    });
  }

  private transformFormDataToApiPayload(formValue: typeof this.form.value): DirectoryServicesUpdate {
    const payload: DirectoryServicesUpdate = {
      service_type: this.mapConfigurationTypeToServiceType(formValue.configuration_type || ''),
      enable: formValue.enable ?? false,
      enable_account_cache: formValue.enable_account_cache ?? true,
      enable_dns_updates: formValue.enable_dns_updates ?? false,
      timeout: formValue.timeout ?? 60,
      kerberos_realm: formValue.kerberos_realm as string | null,
      force: false,
      credential: null,
      configuration: null,
    };

    // Use refined data from sub-components
    if (this.credentialData) {
      payload.credential = this.credentialData;
    }

    if (formValue.configuration_type && formValue.enable && this.configurationData) {
      payload.configuration = this.configurationData;
    }

    return payload;
  }

  private mapConfigurationTypeToServiceType(configurationType: string): DirectoryServiceType | null {
    switch (configurationType as DirectoryServiceType) {
      case DirectoryServiceType.ActiveDirectory: return DirectoryServiceType.ActiveDirectory;
      case DirectoryServiceType.Ldap: return DirectoryServiceType.Ldap;
      case DirectoryServiceType.Ipa: return DirectoryServiceType.Ipa;
      default: return null;
    }
  }

  // Getter methods for template conditionals
  get selectedConfigurationType(): string | null {
    return this.form.controls.configuration_type.value;
  }
}
