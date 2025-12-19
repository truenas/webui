import { ChangeDetectionStrategy, Component, input, output, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of, tap } from 'rxjs';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { helptextIdmap } from 'app/helptext/directory-service/idmap';
import { helptextLdap } from 'app/helptext/directory-service/ldap';
import { DomainIdmap, domainIdmapTypeOptions, PrimaryDomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';

@UntilDestroy()
@Component({
  selector: 'ix-idmap-config',
  templateUrl: './idmap-config.component.html',
  standalone: true,
  imports: [
    IxFieldsetComponent,
    TranslateModule,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdmapConfigComponent implements OnInit {
  private fb = inject(FormBuilder);

  idmap = input.required<PrimaryDomainIdmap>();
  idmapUpdated = output<[useDefaultIdmap: boolean, primaryDomainIdmap: PrimaryDomainIdmap]>();
  isValid = output<boolean>();

  protected readonly helptext = helptextIdmap.idmap;
  protected readonly helptextLdap = helptextLdap;

  protected form = this.fb.group({
    use_default_idmap: [true],
    builtin: this.fb.group({
      name: [null as string, [
        Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
      ]],
      range_low: [90000001 as number, Validators.required],
      range_high: [100000000 as number, Validators.required],
    }, { validators: [Validators.required] }),
    idmap_domain: this.fb.group({
      idmap_backend: [null as IdmapBackend, Validators.required],
      name: [null as string, [
        Validators.required,
        Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
      ]],
      range_low: [100000001 as number, [
        Validators.required,
        Validators.min(1000),
        Validators.max(2147000000),
      ]],
      range_high: [200000000 as number, [
        Validators.required,
        Validators.min(1000),
        Validators.max(2147000000),
      ]],
    }),
  });

  protected readonly idmapType = toSignal(this.form.controls.idmap_domain.controls.idmap_backend.value$);
  protected IdmapBackend = IdmapBackend;

  protected readonly domainIdmapTypeOptions$ = of(domainIdmapTypeOptions);
  protected readonly schemaModeOptions$ = of([
    { label: ActiveDirectorySchemaMode.Rfc2307, value: ActiveDirectorySchemaMode.Rfc2307 },
    { label: ActiveDirectorySchemaMode.Sfu, value: ActiveDirectorySchemaMode.Sfu },
    { label: ActiveDirectorySchemaMode.Sfu20, value: ActiveDirectorySchemaMode.Sfu20 },
  ]);

  ngOnInit(): void {
    this.listenToTypeChanges();
    this.fillFormWithIdmapConfig();
    this.form.value$.pipe(
      tap((value: PrimaryDomainIdmap & { use_default_idmap: boolean }) => {
        this.isValid.emit(this.form.controls.use_default_idmap.value || this.form.valid);

        // Filter out use_default_idmap from the payload as it's UI-only
        const { use_default_idmap: useDefaultIdmap, ...idmapPayload } = value;
        this.idmapUpdated.emit([useDefaultIdmap, idmapPayload as PrimaryDomainIdmap]);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private fillFormWithIdmapConfig(): void {
    this.form.patchValue({
      use_default_idmap: this.idmap() == null,
    });
    if (this.idmap()) {
      this.form.patchValue({
        ...this.idmap(),
      });
    }
  }

  private listenToTypeChanges(): void {
    this.form.controls.idmap_domain.controls.idmap_backend.value$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (type: IdmapBackend) => {
        this.setupFromIdmapBackend(type);
      },
    });
  }

  private setupFromIdmapBackend(type: IdmapBackend): void {
    const idmapFg = this.form.controls.idmap_domain as FormGroup;

    const preservedControls = new Set(['name', 'range_low', 'range_high', 'idmap_backend']);

    Object.keys(idmapFg.controls).forEach((control) => {
      if (!preservedControls.has(control)) {
        idmapFg.removeControl(control);
      }
    });

    if (type === IdmapBackend.Ad) {
      const adInput = this.getInputAs(IdmapBackend.Ad);
      idmapFg.addControl('schema_mode', new FormControl(adInput?.schema_mode ?? null, Validators.required));
      idmapFg.addControl('unix_primary_group', new FormControl(adInput?.unix_primary_group ?? false, Validators.required));
      idmapFg.addControl('unix_nss_info', new FormControl(adInput?.unix_nss_info ?? false, Validators.required));
    } else if (type === IdmapBackend.Rfc2307 || type === IdmapBackend.Ldap) {
      const ldapInput = this.getInputAs(IdmapBackend.Ldap);
      const rfc2307Input = this.getInputAs(IdmapBackend.Rfc2307);

      idmapFg.addControl('ldap_url', new FormControl(ldapInput?.ldap_url ?? rfc2307Input?.ldap_url ?? null, Validators.required));
      idmapFg.addControl('ldap_user_dn', new FormControl(ldapInput?.ldap_user_dn ?? rfc2307Input?.ldap_user_dn ?? null, Validators.required));
      idmapFg.addControl('ldap_user_dn_password', new FormControl(ldapInput?.ldap_user_dn_password ?? rfc2307Input?.ldap_user_dn_password ?? null, Validators.required));
      idmapFg.addControl('validate_certificates', new FormControl(ldapInput?.validate_certificates ?? rfc2307Input?.validate_certificates ?? false, Validators.required));

      if (type === IdmapBackend.Rfc2307) {
        idmapFg.addControl('bind_path_user', new FormControl(rfc2307Input?.bind_path_user ?? null, Validators.required));
        idmapFg.addControl('bind_path_group', new FormControl(rfc2307Input?.bind_path_group ?? null, Validators.required));
        idmapFg.addControl('user_cn', new FormControl(rfc2307Input?.user_cn ?? false, Validators.required));
        idmapFg.addControl('ldap_realm', new FormControl(rfc2307Input?.ldap_realm ?? false, Validators.required));
      }

      if (type === IdmapBackend.Ldap) {
        idmapFg.addControl('ldap_base_dn', new FormControl(ldapInput?.ldap_base_dn ?? null, Validators.required));
        idmapFg.addControl('readonly', new FormControl(ldapInput?.readonly ?? false, Validators.required));
      }
    } else if (type === IdmapBackend.Rid) {
      const ridInput = this.getInputAs(IdmapBackend.Rid);
      idmapFg.addControl('sssd_compat', new FormControl(ridInput?.sssd_compat ?? false));
    }
  }

  /**
   * Returns the input idmap_domain typed as the specified backend, or undefined if it doesn't match.
   */
  private getInputAs<T extends IdmapBackend>(
    backend: T,
  ): Extract<DomainIdmap, { idmap_backend: T }> | undefined {
    const domain = this.idmap()?.idmap_domain;
    return domain?.idmap_backend === backend
      ? domain as Extract<DomainIdmap, { idmap_backend: T }>
      : undefined;
  }
}
