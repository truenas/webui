import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  output,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { startWith } from 'rxjs';
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig, PrimaryDomainIdmap, DomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IdmapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/idmap-config/idmap-config.component';
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
    IxCheckboxComponent,
    TrustedDomainsConfigComponent,
    TranslateModule,
    IdmapConfigComponent,
  ],
})
export class ActiveDirectoryConfigComponent implements OnInit {
  readonly configurationDataChanged = output<DirectoryServicesUpdate['configuration']>();
  readonly kerberosRealmSuggested = output<string | null>();
  protected readonly primaryDomainIdmap = signal<PrimaryDomainIdmap>(null);
  protected readonly isIdmapValid = signal(false);

  protected form = this.fb.group({
    // Basic AD configuration
    hostname: [null, Validators.required],
    domain: [null, [Validators.required]],
    site: [null],
    computer_account_ou: [null],

    // AD options
    use_default_domain: [false, Validators.required],
    enable_trusted_domains: [false, Validators.required],
    use_default_idmap: [true],

    // Trusted domains (managed by sub-component)
    trusted_domains: [[] as unknown[]],
  });

  protected readonly useDefaultIdmap = toSignal(
    this.form.controls.use_default_idmap.valueChanges.pipe(startWith(true)),
  );

  protected readonly enableTrustedDomains = toSignal<boolean>(this.form.controls.enable_trusted_domains.valueChanges);

  get trustedDomainsValue(): Record<string, unknown>[] {
    return (this.form.controls.trusted_domains.value || []) as Record<string, unknown>[];
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      if (this.useDefaultIdmap()) {
        this.primaryDomainIdmap.set(null);
      }
    });
  }

  ngOnInit(): void {
    // Watch for trusted domains changes
    this.form.controls.enable_trusted_domains.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((enableTrustedDomains) => {
        if (!enableTrustedDomains) {
          this.form.controls.trusted_domains.setValue([]);
        }
        this.cdr.markForCheck();
      });

    this.form.controls.domain.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((domain: string | null) => {
        if (domain && typeof domain === 'string') {
          const domainStr = domain.trim();
          if (domainStr) {
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
    this.form.controls.trusted_domains.setValue(trustedDomains, { emitEvent: false });
    this.configurationDataChanged.emit(this.buildActiveDirectoryConfig());
  }

  private buildActiveDirectoryConfig(): ActiveDirectoryConfig | null {
    const formValue = this.form.value;

    if (!formValue.hostname || !formValue.domain) {
      return null;
    }

    return {
      hostname: formValue.hostname as string,
      domain: formValue.domain as string,
      use_default_domain: formValue.use_default_domain ?? false,
      enable_trusted_domains: formValue.enable_trusted_domains ?? false,
      idmap: this.primaryDomainIdmap(),
      site: (formValue.site as string) || null,
      computer_account_ou: (formValue.computer_account_ou as string) || null,
      trusted_domains: this.buildTrustedDomains(formValue.trusted_domains || []),
    };
  }

  private buildTrustedDomains(trustedDomainsData: unknown[]): DomainIdmap[] {
    return trustedDomainsData.map((domain) => {
      const domainRecord = domain as Record<string, unknown>;
      const baseDomain = {
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
}
