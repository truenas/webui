import {
  ChangeDetectionStrategy, Component, input, output, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of, tap } from 'rxjs';
import { ActiveDirectorySchemaMode, IdmapBackend } from 'app/enums/directory-services.enum';
import { domainIdmapTypeOptions, PrimaryDomainIdmap } from 'app/interfaces/active-directory-config.interface';
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
  idmap = input.required<PrimaryDomainIdmap>();
  idmapUpdated = output<[useDefaultIdmap: boolean, primaryDomainIdmap: PrimaryDomainIdmap]>();
  isValid = output<boolean>();

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

  constructor(
    private fb: FormBuilder,
  ) {}

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

    const createRequiredControl = <T>(initial: T): FormControl => new FormControl(initial, Validators.required);

    if (type === IdmapBackend.Ad) {
      idmapFg.addControl('schema_mode', createRequiredControl(null as ActiveDirectorySchemaMode));
      idmapFg.addControl('unix_primary_group', createRequiredControl(false));
      idmapFg.addControl('unix_nss_info', createRequiredControl(false));
    } else if (type === IdmapBackend.Rfc2307 || type === IdmapBackend.Ldap) {
      idmapFg.addControl('ldap_url', createRequiredControl(null as string));
      idmapFg.addControl('ldap_user_dn', createRequiredControl(null as string));
      idmapFg.addControl('ldap_user_dn_password', createRequiredControl(null as string));
      idmapFg.addControl('validate_certificates', createRequiredControl(false));

      if (type === IdmapBackend.Rfc2307) {
        idmapFg.addControl('bind_path_user', createRequiredControl(null as string));
        idmapFg.addControl('bind_path_group', createRequiredControl(null as string));
        idmapFg.addControl('user_cn', createRequiredControl(false));
        idmapFg.addControl('ldap_realm', createRequiredControl(false));
      }

      if (type === IdmapBackend.Ldap) {
        idmapFg.addControl('ldap_base_dn', createRequiredControl(null as string));
        idmapFg.addControl('readonly', createRequiredControl(false));
      }
    } else if (type === IdmapBackend.Rid) {
      idmapFg.addControl('sssd_compat', new FormControl(false));
    }
  }
}
