import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
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
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { DirectoryServicesConfig } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
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
    CredentialConfigComponent,
    ActiveDirectoryConfigComponent,
    LdapConfigComponent,
    IpaConfigComponent,
  ],
})
export class DirectoryServicesFormComponent implements OnInit {
  protected readonly previousConfig = signal<DirectoryServicesConfig | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];

  protected readonly isActiveDirectoryValid = signal(true);
  protected readonly isLdapValid = signal(true);
  protected readonly isIpaValid = signal(true);

  protected readonly isCredentialValid = signal(true);
  protected credentialData: DirectoryServiceCredential | null = null;
  protected readonly DirectoryServiceType = DirectoryServiceType;

  protected readonly isFormValid = computed(() => {
    return this.isActiveDirectoryValid()
      && this.isLdapValid()
      && this.isIpaValid()
      && this.isCredentialValid()
      && this.form.valid;
  });

  protected readonly form = this.fb.group({
    service_type: [null as DirectoryServiceType, Validators.required],
    enable: [false, Validators.required],
    enable_account_cache: [true, Validators.required],
    enable_dns_updates: [false, Validators.required],
    timeout: [30, [Validators.required, Validators.min(1), Validators.max(40)]],
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

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<DirectoryServicesConfig | undefined, boolean>,
  ) {
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
  }

  private fillFormWithPreviousConfig(): void {
    this.form.patchValue(this.previousConfig());
  }

  onCredentialDataChanged(credentialData: DirectoryServicesUpdate['credential']): void {
    this.credentialData = credentialData;
    this.cdr.markForCheck();
  }

  onConfigurationDataChanged(configurationData: DirectoryServicesUpdate['configuration']): void {
    this.configurationData = configurationData;
    this.cdr.markForCheck();
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
    this.form.controls.service_type.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.credentialData = null;
      this.configurationData = null;
      this.cdr.markForCheck();
    });
  }

  private transformFormDataToApiPayload(formValue: typeof this.form.value): DirectoryServicesUpdate {
    const payload: DirectoryServicesUpdate = {
      service_type: this.mapConfigurationTypeToServiceType(formValue.service_type || ''),
      enable: formValue.enable ?? false,
      enable_account_cache: formValue.enable_account_cache ?? true,
      enable_dns_updates: formValue.enable_dns_updates ?? false,
      timeout: formValue.timeout ?? 60,
      kerberos_realm: formValue.kerberos_realm as string | null,
      force: false,
      credential: null,
      configuration: null,
    };

    if (this.credentialData) {
      payload.credential = this.credentialData;
    }

    if (formValue.service_type && formValue.enable && this.configurationData) {
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

  get selectedConfigurationType(): DirectoryServiceType | null {
    return this.form.controls.service_type.value;
  }

  protected getCredentialPrevious(): DirectoryServiceCredential {
    return this.previousConfig()?.credential;
  }
}
