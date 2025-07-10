import {
  ChangeDetectionStrategy,
  Component,
  output,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IpaConfig, IpaSmbDomain } from 'app/interfaces/directoryservices-config.interface';
import { DirectoryServicesUpdate } from 'app/interfaces/directoryservices-update.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';

@UntilDestroy()
@Component({
  selector: 'ix-ipa-config',
  templateUrl: './ipa-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class IpaConfigComponent implements OnInit {
  readonly configurationDataChanged = output<DirectoryServicesUpdate['configuration']>();

  form = this.fb.group({
    // Basic IPA configuration
    ipa_target_server: [null, Validators.required],
    ipa_hostname: [null, Validators.required],
    ipa_domain: [null, Validators.required],
    ipa_basedn: [null, Validators.required],
    ipa_validate_certificates: [false, Validators.required],

    // SMB domain configuration
    use_default_smb_domain: [true],
    smb_domain_name: [null],
    smb_domain_sid: [null],
    smb_domain_range_low: [10000],
    smb_domain_range_high: [90000000],
  });

  get useDefaultSmbDomain(): boolean {
    return this.form.controls.use_default_smb_domain.value ?? true;
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // Watch for use default SMB domain changes
    this.form.controls.use_default_smb_domain.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((useDefault) => {
        this.updateSmbDomainValidators(useDefault);
      });

    // Watch for any form changes
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.configurationDataChanged.emit(this.buildIpaConfig());
      });
  }

  private updateSmbDomainValidators(useDefault: boolean | null): void {
    if (useDefault) {
      // Clear SMB domain fields when using defaults
      this.clearSmbDomainFields();
      this.clearSmbDomainValidators();
    } else {
      // Add validators when not using defaults
      this.form.controls.smb_domain_range_low.setValidators([Validators.required, Validators.min(1000)]);
      this.form.controls.smb_domain_range_high.setValidators([Validators.required]);
    }

    this.updateSmbDomainFormControlValidity();
  }

  private clearSmbDomainFields(): void {
    this.form.controls.smb_domain_name.setValue(null);
    this.form.controls.smb_domain_sid.setValue(null);
    this.form.controls.smb_domain_range_low.setValue(null);
    this.form.controls.smb_domain_range_high.setValue(null);
  }

  private clearSmbDomainValidators(): void {
    this.form.controls.smb_domain_name.clearValidators();
    this.form.controls.smb_domain_sid.clearValidators();
    this.form.controls.smb_domain_range_low.clearValidators();
    this.form.controls.smb_domain_range_high.clearValidators();
  }

  private updateSmbDomainFormControlValidity(): void {
    // Update validation for SMB domain-related controls
    this.form.controls.smb_domain_name.updateValueAndValidity();
    this.form.controls.smb_domain_sid.updateValueAndValidity();
    this.form.controls.smb_domain_range_low.updateValueAndValidity();
    this.form.controls.smb_domain_range_high.updateValueAndValidity();
  }

  private buildIpaConfig(): IpaConfig {
    const formValue = this.form.value;
    const useDefaultSmbDomain = formValue.use_default_smb_domain ?? true;

    let smbDomain: IpaSmbDomain | null = null;
    if (!useDefaultSmbDomain) {
      smbDomain = {
        idmap_backend: IdmapBackend.Sss,
        name: (formValue.smb_domain_name as string) || null,
        domain_name: (formValue.smb_domain_name as string) || null,
        domain_sid: (formValue.smb_domain_sid as string) || null,
        range_low: formValue.smb_domain_range_low || 10000,
        range_high: formValue.smb_domain_range_high || 90000000,
      };
    }

    return {
      target_server: formValue.ipa_target_server || '',
      hostname: formValue.ipa_hostname || '',
      domain: formValue.ipa_domain || '',
      basedn: formValue.ipa_basedn || '',
      validate_certificates: formValue.ipa_validate_certificates ?? false,
      smb_domain: smbDomain,
    };
  }
}
