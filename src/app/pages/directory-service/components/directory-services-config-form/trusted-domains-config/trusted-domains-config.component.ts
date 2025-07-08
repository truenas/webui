import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  input,
  output,
  OnInit,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { ActiveDirectorySchemaMode } from 'app/enums/directory-services.enum';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

@UntilDestroy()
@Component({
  selector: 'ix-trusted-domains-config',
  templateUrl: './trusted-domains-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxListComponent,
    IxListItemComponent,
    TranslateModule,
  ],
})
export class TrustedDomainsConfigComponent implements OnInit {
  readonly trustedDomains = input<Record<string, unknown>[]>([]);
  readonly trustedDomainsChanged = output<Record<string, unknown>[]>();

  form = this.fb.group({
    trustedDomains: this.fb.array([]),
  });

  trustedDomainIdmapOptions$: Observable<Option[]> = of([
    { label: 'Active Directory', value: 'ActiveDirectoryIdmap' },
    { label: 'LDAP', value: 'LdapIdmap' },
    { label: 'RFC2307', value: 'Rfc2307Idmap' },
    { label: 'RID', value: 'RidIdmap' },
  ] as Option[]);

  adSchemaOptions$: Observable<Option[]> = of([
    { label: 'RFC2307', value: ActiveDirectorySchemaMode.Rfc2307 },
    { label: 'SFU', value: ActiveDirectorySchemaMode.Sfu },
    { label: 'SFU20', value: ActiveDirectorySchemaMode.Sfu20 },
  ] as Option[]);

  get trustedDomainsArray(): FormArray {
    return this.form.controls.trustedDomains;
  }

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Initialize with existing trusted domains
    const initialDomains = this.trustedDomains();
    if (initialDomains?.length > 0) {
      initialDomains.forEach((domain) => this.addTrustedDomain(domain));
    }

    // Watch for form changes
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.trustedDomainsChanged.emit(this.trustedDomainsArray.value as Record<string, unknown>[]);
      });
  }

  addTrustedDomain(existingDomain?: Record<string, unknown>): void {
    const domainGroup = this.fb.group({
      trusted_domain_type: [existingDomain?.trusted_domain_type || null, Validators.required],
      name: [existingDomain?.name || null],
      range_low: [existingDomain?.range_low || 10000, [Validators.required, Validators.min(1000)]],
      range_high: [existingDomain?.range_high || 90000000, Validators.required],

      // Active Directory specific
      schema_mode: [existingDomain?.schema_mode || null],
      unix_primary_group: [existingDomain?.unix_primary_group || false],
      unix_nss_info: [existingDomain?.unix_nss_info || false],

      // LDAP specific
      ldap_base_dn: [existingDomain?.ldap_base_dn || null],
      ldap_user_dn: [existingDomain?.ldap_user_dn || null],
      ldap_user_dn_password: [existingDomain?.ldap_user_dn_password || null],
      ldap_url: [existingDomain?.ldap_url || null],
      readonly: [existingDomain?.readonly || false],
      validate_certificates: [existingDomain?.validate_certificates || false],

      // RFC2307 specific
      bind_path_user: [existingDomain?.bind_path_user || null],
      bind_path_group: [existingDomain?.bind_path_group || null],
      user_cn: [existingDomain?.user_cn || false],
      ldap_realm: [existingDomain?.ldap_realm || false],

      // RID specific
      sssd_compat: [existingDomain?.sssd_compat || false],
    });

    // Watch for domain type changes to update validators
    domainGroup.controls.trusted_domain_type.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((domainType) => {
        this.updateTrustedDomainValidators(domainGroup, domainType as string | null);
        this.cdr.markForCheck();
      });

    this.trustedDomainsArray.push(domainGroup);

    // Set initial validators if domain type is already set
    if (existingDomain?.trusted_domain_type) {
      this.updateTrustedDomainValidators(domainGroup, existingDomain.trusted_domain_type as string);
    }
  }

  removeTrustedDomain(index: number): void {
    this.trustedDomainsArray.removeAt(index);
  }

  getTrustedDomainTypeLabel(domainType: string | null): string {
    switch (domainType) {
      case 'ActiveDirectoryIdmap': return 'Active Directory';
      case 'LdapIdmap': return 'LDAP';
      case 'Rfc2307Idmap': return 'RFC2307';
      case 'RidIdmap': return 'RID';
      default: return 'Trusted Domain';
    }
  }

  private updateTrustedDomainValidators(domainGroup: FormGroup, domainType: string | null): void {
    // Clear all domain-specific validators
    this.clearTrustedDomainValidators(domainGroup);

    switch (domainType) {
      case 'ActiveDirectoryIdmap':
        domainGroup.controls.schema_mode.setValidators([Validators.required]);
        domainGroup.controls.unix_primary_group.setValidators([Validators.required]);
        domainGroup.controls.unix_nss_info.setValidators([Validators.required]);
        break;

      case 'LdapIdmap':
        domainGroup.controls.ldap_base_dn.setValidators([Validators.required]);
        domainGroup.controls.ldap_user_dn.setValidators([Validators.required]);
        domainGroup.controls.ldap_user_dn_password.setValidators([Validators.required]);
        domainGroup.controls.ldap_url.setValidators([Validators.required]);
        domainGroup.controls.readonly.setValidators([Validators.required]);
        domainGroup.controls.validate_certificates.setValidators([Validators.required]);
        break;

      case 'Rfc2307Idmap':
        domainGroup.controls.ldap_url.setValidators([Validators.required]);
        domainGroup.controls.ldap_user_dn.setValidators([Validators.required]);
        domainGroup.controls.ldap_user_dn_password.setValidators([Validators.required]);
        domainGroup.controls.bind_path_user.setValidators([Validators.required]);
        domainGroup.controls.bind_path_group.setValidators([Validators.required]);
        domainGroup.controls.user_cn.setValidators([Validators.required]);
        domainGroup.controls.ldap_realm.setValidators([Validators.required]);
        domainGroup.controls.validate_certificates.setValidators([Validators.required]);
        break;

      case 'RidIdmap':
        domainGroup.controls.sssd_compat.setValidators([Validators.required]);
        break;
    }

    // Update validity for all controls without emitting events to prevent recursion
    Object.keys(domainGroup.controls).forEach((key) => {
      domainGroup.controls[key].updateValueAndValidity({ emitEvent: false });
    });
  }

  private clearTrustedDomainValidators(domainGroup: FormGroup): void {
    // Clear validators for all domain-specific fields
    const fieldsToBlank = [
      'schema_mode', 'unix_primary_group', 'unix_nss_info',
      'ldap_base_dn', 'ldap_user_dn', 'ldap_user_dn_password', 'ldap_url', 'readonly', 'validate_certificates',
      'bind_path_user', 'bind_path_group', 'user_cn', 'ldap_realm',
      'sssd_compat',
    ];

    fieldsToBlank.forEach((field) => {
      if (domainGroup.controls[field]) {
        domainGroup.controls[field].clearValidators();
      }
    });
  }
}
