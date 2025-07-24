import {
  ChangeDetectionStrategy,
  Component,
  output,
  OnInit,
  input,
} from '@angular/core';
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
    smb_domain_range_low: [100000001, [
      Validators.min(1000),
      Validators.max(2147000000),
    ]],
    smb_domain_range_high: [200000000, [
      Validators.min(1000),
      Validators.max(2147000000),
    ]],
  });

  protected readonly useDefaultSmbDomain = toSignal(
    this.form.controls.use_default_smb_domain.valueChanges,
    { initialValue: this.form.controls.use_default_smb_domain.value },
  );

  constructor(
    private fb: FormBuilder,
    private validationService: DirectoryServiceValidationService,
  ) {}

  ngOnInit(): void {
    this.fillFormWithPreviousConfig();
    this.setupSmbDomainValidation();
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

  private setupSmbDomainValidation(): void {
    const useDefaultSmbDomain = this.form.controls.use_default_smb_domain.value;

    if (useDefaultSmbDomain) {
      // Remove validators and disable controls for default SMB domain
      this.validationService.disableAndClearControl(this.form, 'smb_domain_domain_name');
      this.validationService.disableAndClearControl(this.form, 'smb_domain_domain_sid');
      this.validationService.disableAndClearControl(this.form, 'smb_domain_name');
      this.validationService.disableAndClearControl(this.form, 'smb_domain_range_high');
      this.validationService.disableAndClearControl(this.form, 'smb_domain_range_low');
    } else {
      // Add validators and enable controls for custom SMB domain
      this.validationService.enableControl(this.form, 'smb_domain_domain_name', [Validators.required]);
      this.validationService.enableControl(this.form, 'smb_domain_domain_sid', [Validators.required]);
      this.validationService.enableControl(this.form, 'smb_domain_name', [
        Validators.required,
        Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
      ]);
      this.validationService.enableControl(this.form, 'smb_domain_range_high');
      this.validationService.enableControl(this.form, 'smb_domain_range_low');
    }

    // Update validity after validator changes
    this.form.controls.smb_domain_domain_name.updateValueAndValidity();
    this.form.controls.smb_domain_domain_sid.updateValueAndValidity();
    this.form.controls.smb_domain_name.updateValueAndValidity();

    // Emit form validity after all updates are complete
    this.isValid.emit(this.form.valid);
  }

  private watchForFormChanges(): void {
    this.form.controls.use_default_smb_domain.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (useDefaultSmbDomain) => {
        if (useDefaultSmbDomain) {
          // Clear values and disable fields
          this.form.patchValue({
            smb_domain_domain_name: null,
            smb_domain_domain_sid: null,
            smb_domain_name: null,
            smb_domain_range_high: null,
            smb_domain_range_low: null,
          });

          // Remove validators and disable controls
          this.validationService.disableAndClearControl(this.form, 'smb_domain_domain_name');
          this.validationService.disableAndClearControl(this.form, 'smb_domain_domain_sid');
          this.validationService.disableAndClearControl(this.form, 'smb_domain_name');
          this.validationService.disableAndClearControl(this.form, 'smb_domain_range_high');
          this.validationService.disableAndClearControl(this.form, 'smb_domain_range_low');
        } else {
          const ipaConfig = this.ipaConfig();
          this.form.patchValue({
            smb_domain_domain_name: ipaConfig?.smb_domain?.domain_name ?? null,
            smb_domain_domain_sid: ipaConfig?.smb_domain?.domain_sid ?? null,
            smb_domain_name: ipaConfig?.smb_domain?.name ?? null,
            smb_domain_range_high: ipaConfig?.smb_domain?.range_high ?? 200000000,
            smb_domain_range_low: ipaConfig?.smb_domain?.range_low ?? 100000001,
          });

          // Add validators and enable controls
          this.validationService.enableControl(this.form, 'smb_domain_domain_name', [Validators.required]);
          this.validationService.enableControl(this.form, 'smb_domain_domain_sid', [Validators.required]);
          this.validationService.enableControl(this.form, 'smb_domain_name', [
            Validators.required,
            Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
          ]);
          this.validationService.enableControl(this.form, 'smb_domain_range_high');
          this.validationService.enableControl(this.form, 'smb_domain_range_low');
        }

        // Update validity after validator changes
        this.form.controls.smb_domain_domain_name.updateValueAndValidity();
        this.form.controls.smb_domain_domain_sid.updateValueAndValidity();
        this.form.controls.smb_domain_name.updateValueAndValidity();

        // Emit form validity after all updates are complete
        this.isValid.emit(this.form.valid);
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
          name: formValue.smb_domain_name,
          range_high: formValue.smb_domain_range_high,
          range_low: formValue.smb_domain_range_low,
          domain_name: formValue.smb_domain_domain_name,
          domain_sid: formValue.smb_domain_domain_sid,
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
