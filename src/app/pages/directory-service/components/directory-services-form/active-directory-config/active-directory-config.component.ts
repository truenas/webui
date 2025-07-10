import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  output,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { IdmapBackend, ActiveDirectorySchemaMode } from 'app/enums/directory-services.enum';
import {
  ActiveDirectoryConfig,
  DomainIdmap,
  PrimaryDomainIdmap,
  PrimaryDomainIdmapAutoRid,
  IdmapDomainBase,
} from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TrustedDomainsConfigComponent } from 'app/pages/directory-service/components/directory-services-form/trusted-domains-config/trusted-domains-config.component';

@UntilDestroy()
@Component({
  selector: 'ix-active-directory-config',
  templateUrl: './active-directory-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    TrustedDomainsConfigComponent,
    TranslateModule,
  ],
})
export class ActiveDirectoryConfigComponent implements OnInit {
  readonly configurationDataChanged = output<DirectoryServicesUpdate['configuration']>();
  readonly kerberosRealmSuggested = output<string | null>();

  form = this.fb.group({
    // Basic AD configuration
    ad_hostname: [null, Validators.required],
    ad_domain: [null, [Validators.required, this.domainValidator]],
    ad_site: [null],
    ad_computer_account_ou: [null],

    // AD options
    ad_use_default_domain: [false, Validators.required],
    ad_enable_trusted_domains: [false, Validators.required],
    ad_use_default_idmap: [false],

    // Idmap configuration
    idmap_backend: [null],
    idmap_range_low: [10000],
    idmap_range_high: [90000000],
    idmap_schema_mode: [null],
    idmap_unix_primary_group: [false],
    idmap_unix_nss_info: [false],

    // Trusted domains (managed by sub-component)
    ad_trusted_domains: [[] as unknown[]],
  });

  idmapBackendOptions$: Observable<Option[]> = of([
    { label: 'Active Directory', value: IdmapBackend.Ad },
    { label: 'AutoRID', value: IdmapBackend.Autorid },
    { label: 'LDAP', value: IdmapBackend.Ldap },
    { label: 'RFC2307', value: IdmapBackend.Rfc2307 },
    { label: 'RID', value: IdmapBackend.Rid },
  ] as Option[]);

  adSchemaOptions$: Observable<Option[]> = of([
    { label: 'RFC2307', value: ActiveDirectorySchemaMode.Rfc2307 },
    { label: 'SFU', value: ActiveDirectorySchemaMode.Sfu },
    { label: 'SFU20', value: ActiveDirectorySchemaMode.Sfu20 },
  ] as Option[]);

  useDefaultIdmap = signal<boolean>(false);
  enableTrustedDomains = signal<boolean>(false);
  selectedIdmapBackend = signal<string | null>(null);

  get trustedDomainsValue(): Record<string, unknown>[] {
    return (this.form.controls.ad_trusted_domains.value || []) as Record<string, unknown>[];
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  // Domain validator to prevent IP addresses
  private domainValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    // Ensure the value is a string before processing
    const rawValue = control.value as unknown;
    if (typeof rawValue !== 'string') {
      return { 'invalid-domain': { message: 'Domain must be a string value' } };
    }

    const value = rawValue.trim();

    // Check if it's an IP address (simple regex)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(value)) {
      return { 'domain-not-ip': { message: 'Domain should be a domain name, not an IP address. Use the hostname field for IP addresses.' } };
    }

    // Check for valid domain format (basic validation)
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
    if (!domainPattern.test(value)) {
      return { 'invalid-domain': { message: 'Please enter a valid domain name (e.g., example.com)' } };
    }

    return null;
  }

  ngOnInit(): void {
    // Initialize signals with current form values
    this.useDefaultIdmap.set(this.form.controls.ad_use_default_idmap.value ?? false);
    this.enableTrustedDomains.set(this.form.controls.ad_enable_trusted_domains.value ?? false);
    this.selectedIdmapBackend.set(this.form.controls.idmap_backend.value as string | null);

    // Watch for use default idmap changes
    this.form.controls.ad_use_default_idmap.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((useDefault) => {
        this.useDefaultIdmap.set(useDefault ?? false);
        this.updateIdmapValidators(useDefault);
        this.cdr.markForCheck();
      });

    // Watch for trusted domains changes
    this.form.controls.ad_enable_trusted_domains.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((enableTrustedDomains) => {
        this.enableTrustedDomains.set(enableTrustedDomains ?? false);
        if (!enableTrustedDomains) {
          this.form.controls.ad_trusted_domains.setValue([]);
        }
        this.cdr.markForCheck();
      });

    // Watch for idmap backend changes
    this.form.controls.idmap_backend.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((backend) => {
        this.selectedIdmapBackend.set(backend as string | null);
        this.updateIdmapBackendFields(backend as string | null);
        this.cdr.markForCheck();
      });

    // Watch for domain changes to suggest Kerberos realm
    this.form.controls.ad_domain.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((domain: string | null) => {
        if (domain && typeof domain === 'string') {
          const domainStr = domain.trim();
          if (domainStr) {
            // Suggest uppercase version of domain as Kerberos realm
            const suggestedRealm = domainStr.toUpperCase();
            this.kerberosRealmSuggested.emit(suggestedRealm);
          } else {
            this.kerberosRealmSuggested.emit(null);
          }
        } else {
          this.kerberosRealmSuggested.emit(null);
        }
      });

    // Watch for any form changes and emit refined configuration object
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.configurationDataChanged.emit(this.buildActiveDirectoryConfig());
      });
  }

  onTrustedDomainsChanged(trustedDomains: unknown[]): void {
    this.form.controls.ad_trusted_domains.setValue(trustedDomains, { emitEvent: false });
    this.configurationDataChanged.emit(this.buildActiveDirectoryConfig());
  }

  private buildActiveDirectoryConfig(): ActiveDirectoryConfig | null {
    const formValue = this.form.value;

    if (!formValue.ad_hostname || !formValue.ad_domain) {
      return null;
    }

    return {
      hostname: formValue.ad_hostname as string,
      domain: formValue.ad_domain as string,
      use_default_domain: formValue.ad_use_default_domain ?? false,
      enable_trusted_domains: formValue.ad_enable_trusted_domains ?? false,
      idmap: this.buildActiveDirectoryIdmap(),
      site: (formValue.ad_site as string) || null,
      computer_account_ou: (formValue.ad_computer_account_ou as string) || null,
      trusted_domains: this.buildTrustedDomains(formValue.ad_trusted_domains || []),
    };
  }

  private buildActiveDirectoryIdmap(): PrimaryDomainIdmap | PrimaryDomainIdmapAutoRid {
    const formValue = this.form.value;

    if (formValue.ad_use_default_idmap || !formValue.idmap_backend) {
      return {
        builtin: {
          name: null,
          range_low: 90000001,
          range_high: 100000000,
        },
        idmap_domain: {
          name: null,
          idmap_backend: IdmapBackend.Ad,
          range_low: formValue.idmap_range_low || 10000,
          range_high: formValue.idmap_range_high || 90000000,
          schema_mode: (formValue.idmap_schema_mode as string) || 'RFC2307',
          unix_primary_group: formValue.idmap_unix_primary_group || false,
          unix_nss_info: formValue.idmap_unix_nss_info || false,
        } as DomainIdmap,
      } as PrimaryDomainIdmap;
    }

    return {
      builtin: {
        name: null,
        range_low: 90000001,
        range_high: 100000000,
      },
      idmap_domain: {
        name: null,
        idmap_backend: formValue.idmap_backend as IdmapBackend,
        range_low: formValue.idmap_range_low || 10000,
        range_high: formValue.idmap_range_high || 90000000,
        schema_mode: (formValue.idmap_schema_mode as string) || 'RFC2307',
        unix_primary_group: formValue.idmap_unix_primary_group || false,
        unix_nss_info: formValue.idmap_unix_nss_info || false,
      } as DomainIdmap,
    } as PrimaryDomainIdmap;
  }

  private buildTrustedDomains(trustedDomainsData: unknown[]): DomainIdmap[] {
    return trustedDomainsData.map((domain) => {
      const domainRecord = domain as Record<string, unknown>;
      const baseDomain: IdmapDomainBase = {
        name: domainRecord['name'] as string || null,
        range_low: domainRecord['range_low'] as number || 10000,
        range_high: domainRecord['range_high'] as number || 90000000,
      };

      const domainType = domainRecord['trusted_domain_type'] as string;
      switch (domainType) {
        case 'ActiveDirectoryIdmap':
          return {
            ...baseDomain,
            idmap_backend: IdmapBackend.Ad,
            schema_mode: domainRecord['schema_mode'] as string || 'RFC2307',
            unix_primary_group: domainRecord['unix_primary_group'] as boolean || false,
            unix_nss_info: domainRecord['unix_nss_info'] as boolean || false,
          } as DomainIdmap;
        case 'LdapIdmap':
          return {
            ...baseDomain,
            idmap_backend: IdmapBackend.Ldap,
            ldap_base_dn: domainRecord['ldap_base_dn'] as string || '',
            ldap_user_dn: domainRecord['ldap_user_dn'] as string || '',
            ldap_user_dn_password: domainRecord['ldap_user_dn_password'] as string || '',
            ldap_url: domainRecord['ldap_url'] as string || '',
            readonly: domainRecord['readonly'] as boolean || false,
            validate_certificates: domainRecord['validate_certificates'] as boolean || false,
          } as DomainIdmap;
        case 'Rfc2307Idmap':
          return {
            ...baseDomain,
            idmap_backend: IdmapBackend.Rfc2307,
            ldap_url: domainRecord['ldap_url'] as string || '',
            ldap_user_dn: domainRecord['ldap_user_dn'] as string || '',
            ldap_user_dn_password: domainRecord['ldap_user_dn_password'] as string || '',
            bind_path_user: domainRecord['bind_path_user'] as string || '',
            bind_path_group: domainRecord['bind_path_group'] as string || '',
            user_cn: domainRecord['user_cn'] as boolean || false,
            ldap_realm: domainRecord['ldap_realm'] as boolean || false,
            validate_certificates: domainRecord['validate_certificates'] as boolean || false,
          } as DomainIdmap;
        case 'RidIdmap':
          return {
            ...baseDomain,
            idmap_backend: IdmapBackend.Rid,
            sssd_compat: domainRecord['sssd_compat'] as boolean || false,
          } as DomainIdmap;
        default:
          return {
            ...baseDomain,
            idmap_backend: IdmapBackend.Rid,
            sssd_compat: false,
          } as DomainIdmap;
      }
    });
  }

  private updateIdmapValidators(useDefault: boolean | null): void {
    if (useDefault) {
      // Clear idmap fields when using defaults
      this.form.controls.idmap_backend.setValue(null);
      this.form.controls.idmap_range_low.setValue(null);
      this.form.controls.idmap_range_high.setValue(null);
      this.form.controls.idmap_schema_mode.setValue(null);
      this.form.controls.idmap_unix_primary_group.setValue(null);
      this.form.controls.idmap_unix_nss_info.setValue(null);

      // Remove validators
      this.form.controls.idmap_backend.clearValidators();
      this.form.controls.idmap_range_low.clearValidators();
      this.form.controls.idmap_range_high.clearValidators();
    } else {
      // Add validators when not using defaults
      this.form.controls.idmap_backend.setValidators([Validators.required]);
      this.form.controls.idmap_range_low.setValidators([Validators.required, Validators.min(1000)]);
      this.form.controls.idmap_range_high.setValidators([Validators.required]);
    }

    this.updateIdmapFormControlValidity();
  }

  private updateIdmapBackendFields(backend: string | null): void {
    // Clear backend-specific validators
    this.form.controls.idmap_schema_mode.clearValidators();
    this.form.controls.idmap_unix_primary_group.clearValidators();
    this.form.controls.idmap_unix_nss_info.clearValidators();

    if (backend === IdmapBackend.Ad as string) {
      this.form.controls.idmap_schema_mode.setValidators([Validators.required]);
      this.form.controls.idmap_unix_primary_group.setValidators([Validators.required]);
      this.form.controls.idmap_unix_nss_info.setValidators([Validators.required]);
    }

    this.updateIdmapFormControlValidity();
  }

  private updateIdmapFormControlValidity(): void {
    this.form.controls.idmap_backend.updateValueAndValidity();
    this.form.controls.idmap_range_low.updateValueAndValidity();
    this.form.controls.idmap_range_high.updateValueAndValidity();
    this.form.controls.idmap_schema_mode.updateValueAndValidity();
    this.form.controls.idmap_unix_primary_group.updateValueAndValidity();
    this.form.controls.idmap_unix_nss_info.updateValueAndValidity();
  }
}
