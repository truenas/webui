import {
  ChangeDetectionStrategy,
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

  protected readonly isTrustedDomainsValid = signal(false);

  protected readonly form = this.fb.group({
    hostname: [null, Validators.required],
    domain: [null, [Validators.required]],
    site: [null],
    computer_account_ou: [null],

    use_default_domain: [false, Validators.required],
    enable_trusted_domains: [false, Validators.required],
    use_default_idmap: [true],

    trusted_domains: [[] as DomainIdmap[]],
  });

  protected readonly useDefaultIdmap = toSignal(
    this.form.controls.use_default_idmap.valueChanges.pipe(startWith(true)),
  );

  protected readonly enableTrustedDomains = toSignal<boolean>(
    this.form.controls.enable_trusted_domains.valueChanges.pipe(startWith(false)),
  );

  constructor(
    private fb: FormBuilder,
  ) {
    effect(() => {
      if (this.useDefaultIdmap()) {
        this.primaryDomainIdmap.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.watchForAdConfigChanges();
  }

  private watchForAdConfigChanges(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.configurationDataChanged.emit(this.buildActiveDirectoryConfig());
      });
  }

  onTrustedDomainsChanged(trustedDomains: DomainIdmap[]): void {
    this.form.controls.trusted_domains.setValue(trustedDomains);
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
      trusted_domains: formValue.trusted_domains || [],
    };
  }
}
