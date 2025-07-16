import {
  ChangeDetectionStrategy,
  Component,
  output,
  OnInit,
  input,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { LdapSchema } from 'app/enums/directory-services.enum';
import {
  PrimaryDomainIdmap,
} from 'app/interfaces/active-directory-config.interface';
import { LdapConfig, LdapSearchBases, LdapAttributeMaps } from 'app/interfaces/ldap-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { hasDeepNonNullValue } from 'app/pages/directory-service/components/directory-services-form/utils';

@UntilDestroy()
@Component({
  selector: 'ix-ldap-config',
  templateUrl: './ldap-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  readonly ldapConfig = input.required<LdapConfig | null>();
  readonly configurationChanged = output<LdapConfig>();
  readonly isValid = output<boolean>();

  protected readonly form = this.fb.group({
    server_urls: [[] as string[], [Validators.required]],
    basedn: [null as string, Validators.required],
    starttls: [false as boolean, Validators.required],
    validate_certificates: [false as boolean, Validators.required],
    schema: [null as LdapSchema, Validators.required],

    use_standard_search_bases: [true],
    search_bases: this.fb.group({
      base_user: [null as string],
      base_group: [null as string],
      base_netgroup: [null as string],
    }),

    use_standard_attribute_maps: [true],
    attribute_maps: this.fb.group({
      passwd: this.fb.group({
        user_object_class: [null as string],
        user_name: [null as string],
        user_uid: [null as string],
        user_gid: [null as string],
        user_gecos: [null as string],
        user_home_directory: [null as string],
        user_shell: [null as string],
      }),
      shadow: this.fb.group({
        shadow_last_change: [null as string],
        shadow_min: [null as string],
        shadow_max: [null as string],
        shadow_warning: [null as string],
        shadow_inactive: [null as string],
        shadow_expire: [null as string],
      }),
      group: this.fb.group({
        group_object_class: [null as string],
        group_gid: [null as string],
        group_member: [null as string],
      }),
      netgroup: this.fb.group({
        netgroup_object_class: [null as string],
        netgroup_member: [null as string],
        netgroup_triple: [null as string],
      }),
    }),
    use_standard_auxiliary_parameters: [true],
    auxiliary_parameters: [null as string],
  });

  protected readonly ldapSchemaOptions$: Observable<Option[]> = of([
    // { label: '', value: null },
    { label: LdapSchema.Rfc2307, value: LdapSchema.Rfc2307 },
    { label: LdapSchema.Rfc2307Bis, value: LdapSchema.Rfc2307Bis },
  ] as Option[]);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.fillFormWithExistingConfig();
    this.watchForFormChanges();

    // Emit current configuration data immediately if form has valid data
    this.emitCurrentConfigurationData();
  }

  private fillFormWithExistingConfig(): void {
    this.form.patchValue({
      ...this.ldapConfig(),
      use_standard_attribute_maps: !hasDeepNonNullValue(this.ldapConfig()?.attribute_maps),
      use_standard_search_bases: !hasDeepNonNullValue(this.ldapConfig()?.search_bases),
      use_standard_auxiliary_parameters: !hasDeepNonNullValue(this.ldapConfig()?.auxiliary_parameters),
    });
  }

  private watchForFormChanges(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isValid.emit(this.form.valid);
        this.configurationChanged.emit(this.buildLdapConfig());
      });
  }

  private emitCurrentConfigurationData(): void {
    // Always emit validity state, even if there's no existing config
    this.isValid.emit(this.form.valid);
    this.configurationChanged.emit(this.buildLdapConfig());
  }

  private buildLdapConfig(): LdapConfig {
    const formValue = this.form.value;

    const searchBases: LdapSearchBases = formValue.use_standard_search_bases
      ? null
      : {
          base_user: (formValue.search_bases.base_user as string | null) || null,
          base_group: (formValue.search_bases.base_group as string | null) || null,
          base_netgroup: (formValue.search_bases.base_netgroup as string | null),
        } as LdapSearchBases;

    const attributeMaps: LdapAttributeMaps = formValue.use_standard_attribute_maps
      ? null
      : formValue.attribute_maps as LdapAttributeMaps;

    const ldapConfig: Partial<LdapConfig & { idmap?: PrimaryDomainIdmap }> = {
      server_urls: formValue.server_urls,
      basedn: formValue.basedn,
      starttls: formValue.starttls,
      validate_certificates: formValue.validate_certificates,
      schema: formValue.schema,
    };

    // Only include search_bases if not null/empty
    if (searchBases) {
      ldapConfig.search_bases = searchBases;
    }

    // Only include attribute_maps if not null/empty
    if (attributeMaps) {
      ldapConfig.attribute_maps = attributeMaps;
    }

    // Only include auxiliary_parameters if not null/empty
    const auxiliaryParams = formValue.use_standard_auxiliary_parameters
      ? null
      : formValue.auxiliary_parameters;
    if (auxiliaryParams) {
      ldapConfig.auxiliary_parameters = auxiliaryParams;
    }

    return ldapConfig as LdapConfig;
  }
}
