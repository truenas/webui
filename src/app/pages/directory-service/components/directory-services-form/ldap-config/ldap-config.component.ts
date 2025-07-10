import {
  ChangeDetectionStrategy,
  Component,
  output,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { IdmapBackend, LdapSchema } from 'app/enums/directory-services.enum';
import {
  PrimaryDomainIdmap, BuiltinDomainTdb, DomainIdmap, LdapIdmap, Rfc2307Idmap, RidIdmap,
} from 'app/interfaces/active-directory-config.interface';
import {
  LdapConfig,
  LdapSearchBases,
  LdapAttributeMaps,
  LdapMapPasswd,
  LdapMapShadow,
  LdapMapGroup,
  LdapMapNetgroup,
} from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';

@UntilDestroy()
@Component({
  selector: 'ix-ldap-config',
  templateUrl: './ldap-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxTextareaComponent,
    TranslateModule,
  ],
})
export class LdapConfigComponent implements OnInit {
  readonly configurationDataChanged = output<DirectoryServicesUpdate['configuration']>();
  readonly isAdvancedMode = signal(false);

  form = this.fb.group({
    // Basic LDAP configuration
    ldap_server_urls: [[] as string[], Validators.required],
    ldap_basedn: [null, Validators.required],
    ldap_starttls: [false, Validators.required],
    ldap_validate_certificates: [false, Validators.required],
    ldap_schema: [null, Validators.required],

    // Advanced options - search bases
    ldap_base_user: [null],
    ldap_base_group: [null],
    ldap_base_netgroup: [null],

    // Advanced options - user attributes
    ldap_user_object_class: [null],
    ldap_user_name: [null],
    ldap_user_uid: [null],
    ldap_user_gid: [null],
    ldap_user_gecos: [null],
    ldap_user_home_directory: [null],
    ldap_user_shell: [null],

    // Advanced options - shadow attributes
    ldap_shadow_last_change: [null],
    ldap_shadow_min: [null],
    ldap_shadow_max: [null],
    ldap_shadow_warning: [null],
    ldap_shadow_inactive: [null],
    ldap_shadow_expire: [null],

    // Advanced options - group attributes
    ldap_group_object_class: [null],
    ldap_group_gid: [null],
    ldap_group_member: [null],
    ldap_netgroup_object_class: [null],
    ldap_netgroup_member: [null],
    ldap_netgroup_triple: [null],

    // Advanced options - auxiliary parameters
    ldap_auxiliary_parameters: [null],

    // ID mapping configuration
    use_default_idmap: [false],
    idmap_backend: [null],
    idmap_range_low: [10000],
    idmap_range_high: [90000000],
    idmap_rangesize: [100000],
    idmap_readonly: [false],
    idmap_ignore_builtin: [false],
    idmap_ldap_base_dn: [null],
    idmap_ldap_user_dn: [null],
    idmap_ldap_user_dn_password: [null],
    idmap_ldap_url: [null],
    idmap_validate_certificates: [false],
    idmap_bind_path_user: [null],
    idmap_bind_path_group: [null],
    idmap_user_cn: [false],
    idmap_ldap_realm: [false],
    idmap_sssd_compat: [false],
  });

  ldapSchemaOptions$: Observable<Option[]> = of([
    { label: 'RFC2307', value: LdapSchema.Rfc2307 },
    { label: 'RFC2307bis', value: LdapSchema.Rfc2307Bis },
  ] as Option[]);

  idmapBackendOptions$: Observable<Option[]> = of([
    { label: 'AutoRID', value: IdmapBackend.Autorid },
    { label: 'LDAP', value: IdmapBackend.Ldap },
    { label: 'RFC2307', value: IdmapBackend.Rfc2307 },
    { label: 'RID', value: IdmapBackend.Rid },
  ] as Option[]);

  get useDefaultIdmap(): boolean {
    return this.form.controls.use_default_idmap.value ?? false;
  }

  get selectedIdmapBackend(): string | null {
    return this.form.controls.idmap_backend.value;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Watch for use default idmap changes
    this.form.controls.use_default_idmap.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((useDefault) => {
        this.updateIdmapValidators(useDefault);
      });

    // Watch for idmap backend changes
    this.form.controls.idmap_backend.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((backend) => {
        this.updateIdmapBackendFields(backend as string | null);
      });

    // Watch for any form changes
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.configurationDataChanged.emit(this.buildLdapConfig());
      });
  }

  onAdvancedModeToggled(): void {
    this.isAdvancedMode.set(!this.isAdvancedMode());
  }

  private updateIdmapValidators(useDefault: boolean | null): void {
    if (useDefault) {
      // Clear idmap fields when using defaults
      this.clearIdmapFields();
      this.clearIdmapValidators();
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
    this.clearBackendSpecificValidators();

    switch (backend as IdmapBackend) {
      case IdmapBackend.Autorid:
        this.form.controls.idmap_rangesize.setValidators([Validators.required]);
        this.form.controls.idmap_readonly.setValidators([Validators.required]);
        this.form.controls.idmap_ignore_builtin.setValidators([Validators.required]);
        break;

      case IdmapBackend.Ldap:
        this.form.controls.idmap_ldap_base_dn.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_user_dn.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_user_dn_password.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_url.setValidators([Validators.required]);
        this.form.controls.idmap_validate_certificates.setValidators([Validators.required]);
        break;

      case IdmapBackend.Rfc2307:
        this.form.controls.idmap_ldap_url.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_user_dn.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_user_dn_password.setValidators([Validators.required]);
        this.form.controls.idmap_bind_path_user.setValidators([Validators.required]);
        this.form.controls.idmap_bind_path_group.setValidators([Validators.required]);
        this.form.controls.idmap_user_cn.setValidators([Validators.required]);
        this.form.controls.idmap_ldap_realm.setValidators([Validators.required]);
        this.form.controls.idmap_validate_certificates.setValidators([Validators.required]);
        break;

      case IdmapBackend.Rid:
        this.form.controls.idmap_sssd_compat.setValidators([Validators.required]);
        break;

      case IdmapBackend.Ad:
      case IdmapBackend.Sss:
        // No specific validators for these backends in LDAP context
        break;
    }

    this.updateIdmapFormControlValidity();
  }

  private clearIdmapFields(): void {
    this.form.controls.idmap_backend.setValue(null);
    this.form.controls.idmap_range_low.setValue(null);
    this.form.controls.idmap_range_high.setValue(null);
    this.form.controls.idmap_rangesize.setValue(null);
    this.form.controls.idmap_readonly.setValue(null);
    this.form.controls.idmap_ignore_builtin.setValue(null);
    this.form.controls.idmap_ldap_base_dn.setValue(null);
    this.form.controls.idmap_ldap_user_dn.setValue(null);
    this.form.controls.idmap_ldap_user_dn_password.setValue(null);
    this.form.controls.idmap_ldap_url.setValue(null);
    this.form.controls.idmap_validate_certificates.setValue(null);
    this.form.controls.idmap_bind_path_user.setValue(null);
    this.form.controls.idmap_bind_path_group.setValue(null);
    this.form.controls.idmap_user_cn.setValue(null);
    this.form.controls.idmap_ldap_realm.setValue(null);
    this.form.controls.idmap_sssd_compat.setValue(null);
  }

  private clearIdmapValidators(): void {
    this.form.controls.idmap_backend.clearValidators();
    this.form.controls.idmap_range_low.clearValidators();
    this.form.controls.idmap_range_high.clearValidators();
    this.clearBackendSpecificValidators();
  }

  private clearBackendSpecificValidators(): void {
    this.form.controls.idmap_rangesize.clearValidators();
    this.form.controls.idmap_readonly.clearValidators();
    this.form.controls.idmap_ignore_builtin.clearValidators();
    this.form.controls.idmap_ldap_base_dn.clearValidators();
    this.form.controls.idmap_ldap_user_dn.clearValidators();
    this.form.controls.idmap_ldap_user_dn_password.clearValidators();
    this.form.controls.idmap_ldap_url.clearValidators();
    this.form.controls.idmap_validate_certificates.clearValidators();
    this.form.controls.idmap_bind_path_user.clearValidators();
    this.form.controls.idmap_bind_path_group.clearValidators();
    this.form.controls.idmap_user_cn.clearValidators();
    this.form.controls.idmap_ldap_realm.clearValidators();
    this.form.controls.idmap_sssd_compat.clearValidators();
  }

  private updateIdmapFormControlValidity(): void {
    // Update validation for all idmap-related controls
    Object.keys(this.form.controls).forEach((key) => {
      if (key.startsWith('idmap_')) {
        const control = this.form.controls[key as keyof typeof this.form.controls];
        if (control) {
          control.updateValueAndValidity();
        }
      }
    });
  }

  private buildLdapConfig(): LdapConfig {
    const formValue = this.form.value;

    // Build search bases
    const searchBases: LdapSearchBases = {
      base_user: (formValue.ldap_base_user as string | null) || null,
      base_group: (formValue.ldap_base_group as string | null) || null,
      base_netgroup: (formValue.ldap_base_netgroup as string | null) || null,
    };

    // Build attribute maps
    const attributeMaps: LdapAttributeMaps = {
      passwd: {
        user_object_class: (formValue.ldap_user_object_class as string | null) || null,
        user_name: (formValue.ldap_user_name as string | null) || null,
        user_uid: (formValue.ldap_user_uid as string | null) || null,
        user_gid: (formValue.ldap_user_gid as string | null) || null,
        user_gecos: (formValue.ldap_user_gecos as string | null) || null,
        user_home_directory: (formValue.ldap_user_home_directory as string | null) || null,
        user_shell: (formValue.ldap_user_shell as string | null) || null,
      } as LdapMapPasswd,
      shadow: {
        shadow_last_change: (formValue.ldap_shadow_last_change as string | null) || null,
        shadow_min: (formValue.ldap_shadow_min as string | null) || null,
        shadow_max: (formValue.ldap_shadow_max as string | null) || null,
        shadow_warning: (formValue.ldap_shadow_warning as string | null) || null,
        shadow_inactive: (formValue.ldap_shadow_inactive as string | null) || null,
        shadow_expire: (formValue.ldap_shadow_expire as string | null) || null,
      } as LdapMapShadow,
      group: {
        group_object_class: (formValue.ldap_group_object_class as string | null) || null,
        group_gid: (formValue.ldap_group_gid as string | null) || null,
        group_member: (formValue.ldap_group_member as string | null) || null,
      } as LdapMapGroup,
      netgroup: {
        netgroup_object_class: (formValue.ldap_netgroup_object_class as string | null) || null,
        netgroup_member: (formValue.ldap_netgroup_member as string | null) || null,
        netgroup_triple: (formValue.ldap_netgroup_triple as string | null) || null,
      } as LdapMapNetgroup,
    };

    // Build the main LDAP configuration
    const ldapConfig: LdapConfig & { idmap?: PrimaryDomainIdmap } = {
      server_urls: (formValue.ldap_server_urls as string[]) || [],
      basedn: (formValue.ldap_basedn as string | null) || '',
      starttls: (formValue.ldap_starttls as boolean) || false,
      validate_certificates: (formValue.ldap_validate_certificates as boolean) || false,
      schema: (formValue.ldap_schema as LdapSchema) || LdapSchema.Rfc2307,
      search_bases: searchBases,
      attribute_maps: attributeMaps,
      auxiliary_parameters: (formValue.ldap_auxiliary_parameters as string | null) || null,
    };

    // Handle idmap configuration if not using defaults
    if (!this.useDefaultIdmap && formValue.idmap_backend) {
      const builtin: BuiltinDomainTdb = {
        name: null,
        range_low: 1000,
        range_high: 999999,
      };

      const baseDomainIdmap = {
        name: null as string | null,
        range_low: (formValue.idmap_range_low as number) || 10000,
        range_high: (formValue.idmap_range_high as number) || 90000000,
      };

      let domainIdmap: DomainIdmap;

      switch (formValue.idmap_backend as IdmapBackend) {
        case IdmapBackend.Ldap:
          domainIdmap = {
            ...baseDomainIdmap,
            idmap_backend: IdmapBackend.Ldap,
            ldap_base_dn: (formValue.idmap_ldap_base_dn as string | null) || '',
            ldap_user_dn: (formValue.idmap_ldap_user_dn as string | null) || '',
            ldap_user_dn_password: (formValue.idmap_ldap_user_dn_password as string | null) || '',
            ldap_url: (formValue.idmap_ldap_url as string | null) || '',
            readonly: (formValue.idmap_readonly as boolean) || false,
            validate_certificates: (formValue.idmap_validate_certificates as boolean) || false,
          } as LdapIdmap;
          (ldapConfig as LdapConfig & { idmap: PrimaryDomainIdmap }).idmap = {
            builtin,
            idmap_domain: domainIdmap,
          } as PrimaryDomainIdmap;
          break;

        case IdmapBackend.Rfc2307:
          domainIdmap = {
            ...baseDomainIdmap,
            idmap_backend: IdmapBackend.Rfc2307,
            ldap_url: (formValue.idmap_ldap_url as string | null) || '',
            ldap_user_dn: (formValue.idmap_ldap_user_dn as string | null) || '',
            ldap_user_dn_password: (formValue.idmap_ldap_user_dn_password as string | null) || '',
            bind_path_user: (formValue.idmap_bind_path_user as string | null) || '',
            bind_path_group: (formValue.idmap_bind_path_group as string | null) || '',
            user_cn: (formValue.idmap_user_cn as boolean) || false,
            ldap_realm: (formValue.idmap_ldap_realm as boolean) || false,
            validate_certificates: (formValue.idmap_validate_certificates as boolean) || false,
          } as Rfc2307Idmap;
          (ldapConfig as LdapConfig & { idmap: PrimaryDomainIdmap }).idmap = {
            builtin,
            idmap_domain: domainIdmap,
          } as PrimaryDomainIdmap;
          break;

        case IdmapBackend.Rid:
          domainIdmap = {
            ...baseDomainIdmap,
            idmap_backend: IdmapBackend.Rid,
            sssd_compat: (formValue.idmap_sssd_compat as boolean) || false,
          } as RidIdmap;
          (ldapConfig as LdapConfig & { idmap: PrimaryDomainIdmap }).idmap = {
            builtin,
            idmap_domain: domainIdmap,
          } as PrimaryDomainIdmap;
          break;

        case IdmapBackend.Ad:
        case IdmapBackend.Sss:
          // No specific idmap configuration for these backends in LDAP context
          // They would not be used with LDAP configuration
          break;

        default:
          // Handle any unexpected backend values
          console.warn(`Unexpected idmap backend: ${formValue.idmap_backend as string}`);
          break;
      }
    }

    return ldapConfig;
  }
}
