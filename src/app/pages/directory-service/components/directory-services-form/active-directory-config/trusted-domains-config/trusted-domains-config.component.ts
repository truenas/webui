import { ChangeDetectionStrategy, Component, input, output, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { helptextActiveDirectory } from 'app/helptext/directory-service/active-directory';
import { helptextIdmap } from 'app/helptext/directory-service/idmap';
import { helptextLdap } from 'app/helptext/directory-service/ldap';
import {
  ActiveDirectoryIdmap, DomainIdmap, domainIdmapTypeOptions, LdapIdmap, Rfc2307Idmap, RidIdmap,
} from 'app/interfaces/active-directory-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

type Controls<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

interface IdmapBackendDomain { idmap_backend: IdmapBackend }

interface AllTrustedDomainsIdmapFieldsInterface {
  name: string | null;
  range_low: number;
  range_high: number;
  idmap_backend: IdmapBackend;
  schema_mode: ActiveDirectorySchemaMode;
  unix_primary_group: boolean;
  unix_nss_info: boolean;
  ldap_base_dn: string;
  readonly: boolean;
  ldap_url: string;
  ldap_user_dn: string;
  ldap_user_dn_password: string;
  bind_path_user: string;
  bind_path_group: string;
  user_cn: boolean;
  ldap_realm: boolean;
  validate_certificates: boolean;
  sssd_compat: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-trusted-domains-config',
  templateUrl: './trusted-domains-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  private fb = inject(FormBuilder);

  protected readonly helptextAd = helptextActiveDirectory;
  protected readonly helptext = helptextIdmap.idmap;
  protected readonly helptextLdap = helptextLdap;

  readonly enableTrustedDomains = input.required<boolean>();
  trustedDomainsChanged = output<[enableTrustedDomains: boolean, trustedDomains: DomainIdmap[]]>();
  readonly isValid = output<boolean>();
  readonly trustedDomains = input.required<DomainIdmap[]>();

  protected readonly IdmapBackend = IdmapBackend;

  protected readonly schemaModeOptions$ = of([
    { label: ActiveDirectorySchemaMode.Rfc2307, value: ActiveDirectorySchemaMode.Rfc2307 },
    { label: ActiveDirectorySchemaMode.Sfu, value: ActiveDirectorySchemaMode.Sfu },
    { label: ActiveDirectorySchemaMode.Sfu20, value: ActiveDirectorySchemaMode.Sfu20 },
  ]);

  protected readonly form = this.fb.group({
    enable_trusted_domains: [false],
    trustedDomains: this.fb.array<AllTrustedDomainsIdmapFieldsInterface>([]),
  });

  protected readonly trustedDomainIdmapOptions$: Observable<Option[]> = of(domainIdmapTypeOptions);

  protected get trustedDomainsArray(): FormArray {
    return this.form.controls.trustedDomains;
  }

  ngOnInit(): void {
    this.initializeFormOnEdit();

    this.watchForFormChanges();
  }

  private initializeFormOnEdit(): void {
    this.form.controls.enable_trusted_domains.setValue(this.enableTrustedDomains());
    const initialDomains = this.trustedDomains() ?? [];
    if (initialDomains?.length > 0) {
      initialDomains.forEach((domain) => this.addTrustedDomain(domain));
    }
  }

  private watchForFormChanges(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        const trustedDomains = value.trustedDomains;
        const builtCustomDomains: DomainIdmap[] = [];
        for (const domain of trustedDomains) {
          if (domain.idmap_backend === IdmapBackend.Ad) {
            const adIdmap: ActiveDirectoryIdmap = {
              idmap_backend: IdmapBackend.Ad,
              name: domain.name,
              range_high: domain.range_high,
              range_low: domain.range_low,
              schema_mode: domain.schema_mode,
              unix_nss_info: domain.unix_nss_info,
              unix_primary_group: domain.unix_primary_group,
            };
            builtCustomDomains.push(adIdmap);
          }
          if (domain.idmap_backend === IdmapBackend.Ldap) {
            const ldapIdmap: LdapIdmap = {
              idmap_backend: IdmapBackend.Ldap,
              name: domain.name,
              range_high: domain.range_high,
              range_low: domain.range_low,
              ldap_base_dn: domain.ldap_base_dn,
              ldap_url: domain.ldap_url,
              ldap_user_dn: domain.ldap_user_dn,
              ldap_user_dn_password: domain.ldap_user_dn_password,
              readonly: domain.readonly,
              validate_certificates: domain.validate_certificates,
            };
            builtCustomDomains.push(ldapIdmap);
          }
          if (domain.idmap_backend === IdmapBackend.Rfc2307) {
            const rfc2307Idmap: Rfc2307Idmap = {
              idmap_backend: IdmapBackend.Rfc2307,
              name: domain.name,
              range_high: domain.range_high,
              range_low: domain.range_low,
              ldap_url: domain.ldap_url,
              ldap_user_dn: domain.ldap_user_dn,
              ldap_user_dn_password: domain.ldap_user_dn_password,
              bind_path_user: domain.bind_path_user,
              bind_path_group: domain.bind_path_group,
              user_cn: domain.user_cn,
              ldap_realm: domain.ldap_realm,
              validate_certificates: domain.validate_certificates,
            };
            builtCustomDomains.push(rfc2307Idmap);
          }
          if (domain.idmap_backend === IdmapBackend.Rid) {
            const ridIdmap: RidIdmap = {
              idmap_backend: IdmapBackend.Rid,
              name: domain.name,
              range_high: domain.range_high,
              range_low: domain.range_low,
              sssd_compat: domain.sssd_compat,
            };
            builtCustomDomains.push(ridIdmap);
          }
        }
        this.trustedDomainsChanged.emit([value.enable_trusted_domains, builtCustomDomains]);
        this.isValid.emit(this.form.valid);
      });
  }

  protected addTrustedDomain(existingDomain?: DomainIdmap): void {
    const trustedDomainFg = this.fb.group({
      idmap_backend: this.fb.control(existingDomain?.idmap_backend ?? null, Validators.required),
      name: this.fb.control(existingDomain?.name ?? null as string, Validators.required),
      range_high: this.fb.control<number>(existingDomain?.range_high ?? null, Validators.required),
      range_low: this.fb.control<number>(existingDomain?.range_low ?? null, Validators.required),
      sssd_compat: this.fb.control<boolean>(
        (existingDomain as RidIdmap)?.sssd_compat ?? false,
      ),
      schema_mode: new FormControl<ActiveDirectorySchemaMode>(
        (existingDomain as ActiveDirectoryIdmap)?.schema_mode ?? null,
        Validators.required,
      ),
      unix_primary_group: this.fb.control<boolean>(
        (existingDomain as ActiveDirectoryIdmap)?.unix_primary_group ?? false,
      ),
      unix_nss_info: this.fb.control<boolean>(
        (existingDomain as ActiveDirectoryIdmap)?.unix_nss_info ?? false,
      ),
      ldap_url: this.fb.control<string>(
        (existingDomain as LdapIdmap)?.ldap_url ?? null,
        Validators.required,
      ),
      ldap_user_dn: this.fb.control<string>(
        (existingDomain as LdapIdmap)?.ldap_user_dn ?? null,
        Validators.required,
      ),
      ldap_base_dn: this.fb.control<string>(
        (existingDomain as LdapIdmap)?.ldap_base_dn ?? null,
        Validators.required,
      ),
      ldap_user_dn_password: this.fb.control<string>(
        (existingDomain as LdapIdmap)?.ldap_user_dn_password ?? null,
        Validators.required,
      ),
      readonly: this.fb.control<boolean>(
        (existingDomain as LdapIdmap)?.readonly ?? false,
      ),
      validate_certificates: this.fb.control<boolean>(
        (existingDomain as LdapIdmap)?.validate_certificates ?? false,
      ),
      bind_path_user: this.fb.control<string>(
        (existingDomain as Rfc2307Idmap)?.bind_path_user ?? null,
        Validators.required,
      ),
      bind_path_group: this.fb.control<string>(
        (existingDomain as Rfc2307Idmap)?.bind_path_group ?? null,
        Validators.required,
      ),
      user_cn: this.fb.control<boolean>(
        (existingDomain as Rfc2307Idmap)?.user_cn ?? false,
      ),
      ldap_realm: this.fb.control<boolean>(
        (existingDomain as Rfc2307Idmap)?.ldap_realm ?? false,
      ),
    });

    this.form.controls.trustedDomains.push(trustedDomainFg);
  }

  protected removeTrustedDomain(index: number): void {
    this.form.controls.trustedDomains.removeAt(index);
  }

  protected getDomains(): FormGroup<Controls<IdmapBackendDomain>>[] {
    return this.form.controls.trustedDomains.controls;
  }

  protected getIdmapTypeForItem(index: number): IdmapBackend {
    return (
      this.form.controls.trustedDomains.at(index) as FormGroup<Record<string, AbstractControl>>
    ).controls.idmap_backend.value as IdmapBackend;
  }
}
