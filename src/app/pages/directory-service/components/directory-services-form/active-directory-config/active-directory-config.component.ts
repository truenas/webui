import { ChangeDetectionStrategy, Component, output, OnInit, signal, effect, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { ActiveDirectoryConfig, PrimaryDomainIdmap, DomainIdmap } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IdmapConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/idmap-config/idmap-config.component';
import { TrustedDomainsConfigComponent } from 'app/pages/directory-service/components/directory-services-form/active-directory-config/trusted-domains-config/trusted-domains-config.component';

@UntilDestroy()
@Component({
  selector: 'ix-active-directory-config',
  templateUrl: './active-directory-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  private fb = inject(FormBuilder);

  readonly activeDirectoryConfig = input.required<ActiveDirectoryConfig | null>();
  readonly isValid = output<boolean>();

  readonly configurationChanged = output<DirectoryServicesUpdate['configuration']>();
  readonly kerberosRealmSuggested = output<string | null>();

  protected readonly primaryDomainIdmap = signal<PrimaryDomainIdmap>(null);
  protected readonly isIdmapValid = signal(true);
  protected readonly isTrustedDomainsValid = signal(true);

  protected readonly form = this.fb.group({
    hostname: [null as string, Validators.required],
    domain: [null as string, [Validators.required]],
    site: [null as string],
    computer_account_ou: [null as string],

    use_default_domain: [false],
    enable_trusted_domains: [false],

    trusted_domains: [[] as DomainIdmap[]],
  });

  private readonly formValid = toSignal(this.form.valueChanges.pipe(
    map(() => {
      this.configurationChanged.emit(this.buildActiveDirectoryConfig());
      return this.form.valid;
    }),
  ));

  protected readonly useDefaultIdmap = signal(true);

  constructor() {
    effect(() => {
      if (this.useDefaultIdmap()) {
        this.primaryDomainIdmap.set(null);
      }

      const isIdmapValid = this.isIdmapValid();
      const isTrustedDomainsValid = this.isTrustedDomainsValid();
      this.isValid.emit(this.formValid() && isIdmapValid && isTrustedDomainsValid);
      this.configurationChanged.emit(this.buildActiveDirectoryConfig());
    });
  }

  ngOnInit(): void {
    this.updateFormWithExistingConfig();

    // Emit current configuration data immediately if form has valid data
    this.emitCurrentConfigurationData();
  }

  private updateFormWithExistingConfig(): void {
    this.form.patchValue({
      ...this.activeDirectoryConfig(),
    });
  }

  private emitCurrentConfigurationData(): void {
    // Always emit validity state, even if there's no existing config
    this.configurationChanged.emit(this.buildActiveDirectoryConfig());
  }

  protected primaryDomainIdmapUpdated(
    [useDefaultIdmap, primaryDomainIdmap]: [useDefaultIdmap: boolean, primaryDomainIdmap: PrimaryDomainIdmap],
  ): void {
    this.useDefaultIdmap.set(useDefaultIdmap);
    if (useDefaultIdmap) {
      this.primaryDomainIdmap.set(null);
    } else {
      this.primaryDomainIdmap.set(primaryDomainIdmap);
    }
  }

  protected onTrustedDomainsChanged(
    [enableTrustedDomains, trustedDomains]: [enableTrustedDomains: boolean, trustedDomains: DomainIdmap[]],
  ): void {
    this.form.controls.enable_trusted_domains.setValue(enableTrustedDomains);
    this.form.controls.trusted_domains.setValue(trustedDomains);
  }

  private buildActiveDirectoryConfig(): ActiveDirectoryConfig | null {
    const formValue = this.form.value;

    if (!formValue.hostname || !formValue.domain) {
      return null;
    }

    const config: Partial<ActiveDirectoryConfig> = {
      hostname: formValue.hostname as string,
      domain: formValue.domain as string,
      use_default_domain: formValue.use_default_domain ?? false,
      enable_trusted_domains: formValue.enable_trusted_domains ?? false,
      computer_account_ou: (formValue.computer_account_ou as string) || null,
      trusted_domains: formValue.trusted_domains || [],
    };

    // Only include idmap if it's not null/empty
    const idmap = this.primaryDomainIdmap();
    if (idmap) {
      config.idmap = idmap;
    }

    // Only include site if it's not null/empty
    const site = (formValue.site as string) || null;
    if (site) {
      config.site = site;
    }

    return config as ActiveDirectoryConfig;
  }
}
