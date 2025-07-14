import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  OnInit,
} from '@angular/core';
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
import { DomainIdmap, domainIdmapTypeOptions } from 'app/interfaces/active-directory-config.interface';
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
  readonly enableTrustedDomains = input.required<boolean>();
  readonly trustedDomains = input<DomainIdmap[]>([]);
  readonly trustedDomainsChanged = output<[enableTrustedDomains: boolean, trustedDomains: DomainIdmap[]]>();
  readonly isValid = output<boolean>();

  protected readonly IdmapBackend = IdmapBackend;

  protected readonly form = this.fb.group({
    enable_trusted_domains: [false],
    trustedDomains: this.fb.array<FormGroup<Record<string, AbstractControl>>>([]),
  });

  protected readonly trustedDomainIdmapOptions$: Observable<Option[]> = of(domainIdmapTypeOptions);

  protected readonly schemaModeOptions$ = of([
    { label: ActiveDirectorySchemaMode.Rfc2307, value: ActiveDirectorySchemaMode.Rfc2307 },
    { label: ActiveDirectorySchemaMode.Sfu, value: ActiveDirectorySchemaMode.Sfu },
    { label: ActiveDirectorySchemaMode.Sfu20, value: ActiveDirectorySchemaMode.Sfu20 },
  ]);

  get trustedDomainsArray(): FormArray {
    return this.form.controls.trustedDomains;
  }

  constructor(
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initializeFormOnEdit();

    this.watchForFormChanges();
  }

  private initializeFormOnEdit(): void {
    this.form.controls.enable_trusted_domains.setValue(this.enableTrustedDomains());
    const initialDomains = this.trustedDomains();
    if (initialDomains?.length > 0) {
      initialDomains.forEach((domain) => this.addTrustedDomain(domain));
    }
  }

  private watchForFormChanges(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.trustedDomainsChanged.emit([
          this.form.controls.enable_trusted_domains.value,
          this.form.controls.trustedDomains.value as unknown as DomainIdmap[],
        ]);
        this.isValid.emit(this.form.valid);
      });
  }

  protected addTrustedDomain(existingDomain?: DomainIdmap): void {
    const domainGroup = this.getTrustedDomainFg(existingDomain);

    (this.form.controls.trustedDomains as FormArray<FormGroup<Record<string, AbstractControl>>>).push(domainGroup);
  }

  removeTrustedDomain(index: number): void {
    this.form.controls.trustedDomains.removeAt(index);
  }

  private getTrustedDomainFg(existingDomain?: DomainIdmap): FormGroup<Record<string, AbstractControl>> {
    const trustedDomainFg = this.fb.group({
      idmap_backend: [null as IdmapBackend, Validators.required],
      name: [existingDomain?.name ?? null as string, [
        Validators.required,
        Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
      ]],
      range_low: [existingDomain?.range_low ?? 100000001 as number, [
        Validators.required,
        Validators.min(1000),
        Validators.max(2147000000),
      ]],
      range_high: [existingDomain?.range_high ?? 200000000 as number, [
        Validators.required,
        Validators.min(1000),
        Validators.max(2147000000),
      ]],
    });

    const createRequiredControl = <T>(initial: T): FormControl<T> => new FormControl(initial, Validators.required);

    trustedDomainFg.controls.idmap_backend.value$.pipe(untilDestroyed(this)).subscribe({
      next: (type: IdmapBackend) => {
        const preservedControls = new Set(['name', 'range_low', 'range_high', 'idmap_backend']);

        Object.keys(trustedDomainFg.controls).forEach((control) => {
          if (!preservedControls.has(control)) {
            trustedDomainFg.removeControl(control);
          }
        });

        if (type === IdmapBackend.Ad) {
          trustedDomainFg.addControl('schema_mode', createRequiredControl(null as ActiveDirectorySchemaMode));
          trustedDomainFg.addControl('unix_primary_group', createRequiredControl(false));
          trustedDomainFg.addControl('unix_nss_info', createRequiredControl(false));
        } else if (type === IdmapBackend.Rfc2307 || type === IdmapBackend.Ldap) {
          trustedDomainFg.addControl('ldap_url', createRequiredControl(null as string));
          trustedDomainFg.addControl('ldap_user_dn', createRequiredControl(null as string));
          trustedDomainFg.addControl('ldap_user_dn_password', createRequiredControl(null as string));
          trustedDomainFg.addControl('validate_certificates', createRequiredControl(false));

          if (type === IdmapBackend.Rfc2307) {
            trustedDomainFg.addControl('bind_path_user', createRequiredControl(null as string));
            trustedDomainFg.addControl('bind_path_group', createRequiredControl(null as string));
            trustedDomainFg.addControl('user_cn', createRequiredControl(false));
            trustedDomainFg.addControl('ldap_realm', createRequiredControl(false));
          }

          if (type === IdmapBackend.Ldap) {
            trustedDomainFg.addControl('ldap_base_dn', createRequiredControl(null as string));
            trustedDomainFg.addControl('readonly', createRequiredControl(false));
          }
        } else if (type === IdmapBackend.Rid) {
          trustedDomainFg.addControl('sssd_compat', createRequiredControl(false));
        }

        if (type !== existingDomain?.idmap_backend) {
          return;
        }

        for (const key of Object.keys(existingDomain) as (keyof DomainIdmap)[]) {
          (trustedDomainFg.controls[key] as AbstractControl<unknown>).setValue(existingDomain[key]);
        }
      },
    });

    return trustedDomainFg;
  }

  protected getIdmapTypeForItem(index: number): IdmapBackend {
    return (
      this.form.controls.trustedDomains.at(index) as FormGroup<Record<string, AbstractControl>>
    ).controls.idmap_backend.value as IdmapBackend;
  }
}
