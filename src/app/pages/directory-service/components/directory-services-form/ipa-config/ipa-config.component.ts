import { ChangeDetectionStrategy, Component, output, OnInit, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IpaConfig, IpaSmbDomain } from 'app/interfaces/ipa-config.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { DirectoryServiceValidationService } from 'app/pages/directory-service/components/directory-services-form/services/directory-service-validation.service';
import { hasDeepNonNullValue } from 'app/pages/directory-service/components/directory-services-form/utils';

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
  standalone: true,
})
export class IpaConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private validationService = inject(DirectoryServiceValidationService);

  private readonly SMB_RANGE_MIN = 1000;
  private readonly SMB_RANGE_MAX = 2147000000;
  private readonly SMB_RANGE_LOW_DEFAULT = 100000001;
  private readonly SMB_RANGE_HIGH_DEFAULT = 200000000;
  readonly ipaConfig = input.required<IpaConfig | null>();
  readonly configurationChanged = output<IpaConfig>();
  readonly isValid = output<boolean>();

  protected readonly form = this.fb.group({
    target_server: [null as string, Validators.required],
    hostname: [null as string, Validators.required],
    domain: [null as string, Validators.required],
    basedn: [null as string, Validators.required],
    validate_certificates: [false, Validators.required],
    use_default_smb_domain: [true],
    smb_domain_name: [null as string],
    smb_domain_domain_name: [null as string],
    smb_domain_domain_sid: [null as string],
    smb_domain_range_low: [this.SMB_RANGE_LOW_DEFAULT, [
      Validators.min(this.SMB_RANGE_MIN),
      Validators.max(this.SMB_RANGE_MAX),
    ]],
    smb_domain_range_high: [this.SMB_RANGE_HIGH_DEFAULT, [
      Validators.min(this.SMB_RANGE_MIN),
      Validators.max(this.SMB_RANGE_MAX),
    ]],
  });

  protected readonly useDefaultSmbDomain = toSignal(
    this.form.controls.use_default_smb_domain.valueChanges,
    { initialValue: this.form.controls.use_default_smb_domain.value },
  );

  ngOnInit(): void {
    this.fillFormWithPreviousConfig();
    this.updateSmbDomainValidation(this.form.controls.use_default_smb_domain.value);
    this.watchForFormChanges();

    // Emit current configuration data immediately if form has valid data
    this.emitCurrentConfigurationData();
  }

  private fillFormWithPreviousConfig(): void {
    const ipaConfig = this.ipaConfig();
    if (!ipaConfig) {
      return;
    }
    this.form.patchValue(ipaConfig);
    this.form.controls.smb_domain_domain_name.setValue(ipaConfig.smb_domain?.domain_name ?? null as string);
    this.form.controls.smb_domain_name.setValue(ipaConfig.smb_domain?.name ?? null as string);
    this.form.controls.smb_domain_range_high.setValue(ipaConfig.smb_domain?.range_high ?? null as number);
    this.form.controls.smb_domain_range_low.setValue(ipaConfig.smb_domain?.range_low ?? null as number);
    this.form.controls.smb_domain_domain_sid.setValue(ipaConfig.smb_domain?.domain_sid ?? null as string);
    this.form.controls.use_default_smb_domain.setValue(!hasDeepNonNullValue(ipaConfig.smb_domain));
  }

  private emitCurrentConfigurationData(): void {
    // Only emit if there's existing config to work with
    const ipaConfig = this.ipaConfig();
    if (ipaConfig) {
      // Emit validity state and configuration data
      this.isValid.emit(this.form.valid);
      this.configurationChanged.emit(this.buildIpaConfig());
    }
  }

  private updateSmbDomainValidation(useDefaultSmbDomain: boolean): void {
    const smbDomainControls = [
      'smb_domain_domain_name',
      'smb_domain_domain_sid',
      'smb_domain_name',
      'smb_domain_range_high',
      'smb_domain_range_low',
    ] as const;

    if (useDefaultSmbDomain) {
      // Remove validators and disable controls for default SMB domain
      smbDomainControls.forEach((controlName) => {
        this.validationService.disableAndClearControl(this.form, controlName);
      });
    } else {
      // Add validators and enable controls for custom SMB domain
      this.validationService.enableControl(this.form, 'smb_domain_domain_name');
      this.validationService.enableControl(this.form, 'smb_domain_domain_sid');
      this.validationService.enableControl(this.form, 'smb_domain_name', [
        Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.\-_!@#$%^&()'{}~]{1,15}$/),
      ]);
      this.validationService.enableControl(this.form, 'smb_domain_range_high');
      this.validationService.enableControl(this.form, 'smb_domain_range_low');
    }

    // Batch update validity for better performance
    ['smb_domain_domain_name', 'smb_domain_domain_sid', 'smb_domain_name'].forEach((controlName) => {
      this.form.controls[controlName as keyof typeof this.form.controls].updateValueAndValidity();
    });

    // Emit form validity after all updates are complete
    this.isValid.emit(this.form.valid);
  }

  private watchForFormChanges(): void {
    this.form.controls.use_default_smb_domain.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (useDefaultSmbDomain) => {
        if (useDefaultSmbDomain) {
          // Clear values when using default SMB domain
          this.form.patchValue({
            smb_domain_domain_name: null,
            smb_domain_domain_sid: null,
            smb_domain_name: null,
            smb_domain_range_high: null,
            smb_domain_range_low: null,
          });
        } else {
          // Restore values from config when not using default
          const ipaConfig = this.ipaConfig();
          this.form.patchValue({
            smb_domain_domain_name: ipaConfig?.smb_domain?.domain_name ?? null,
            smb_domain_domain_sid: ipaConfig?.smb_domain?.domain_sid ?? null,
            smb_domain_name: ipaConfig?.smb_domain?.name ?? null,
            smb_domain_range_high: ipaConfig?.smb_domain?.range_high ?? this.SMB_RANGE_HIGH_DEFAULT,
            smb_domain_range_low: ipaConfig?.smb_domain?.range_low ?? this.SMB_RANGE_LOW_DEFAULT,
          });
        }

        // Use the refactored method to update validation
        this.updateSmbDomainValidation(useDefaultSmbDomain);
      },
    });
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isValid.emit(this.form.valid);
        this.configurationChanged.emit(this.buildIpaConfig());
      });
  }

  private buildIpaConfig(): IpaConfig {
    const formValue = this.form.value;
    const useDefaultSmbDomain = formValue.use_default_smb_domain;

    const smbDomain: IpaSmbDomain | null = useDefaultSmbDomain
      ? null
      : {
          name: formValue.smb_domain_name || null,
          range_high: formValue.smb_domain_range_high,
          range_low: formValue.smb_domain_range_low,
          domain_name: formValue.smb_domain_domain_name || null,
          domain_sid: formValue.smb_domain_domain_sid || null,
          idmap_backend: IdmapBackend.Sss,
        } as IpaSmbDomain;

    return {
      target_server: formValue.target_server || '',
      hostname: formValue.hostname || '',
      domain: formValue.domain || '',
      basedn: formValue.basedn || '',
      validate_certificates: formValue.validate_certificates ?? false,
      smb_domain: smbDomain,
    };
  }
}
