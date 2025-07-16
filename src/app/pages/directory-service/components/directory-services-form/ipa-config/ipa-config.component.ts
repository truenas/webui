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
    smb_domain_name: [null as string, [
      Validators.required,
      Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
    ]],
    smb_domain_domain_name: [null as string, Validators.required],
    smb_domain_domain_sid: [null as string, Validators.required],
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
  );

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.fillFormWithPreviousConfig();
    this.watchForFormChanges();
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

  private watchForFormChanges(): void {
    this.form.controls.use_default_smb_domain.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (useDefaultSmbDomain) => {
        if (useDefaultSmbDomain) {
          this.form.patchValue({
            smb_domain_domain_name: null,
            smb_domain_domain_sid: null,
            smb_domain_name: null,
            smb_domain_range_high: null,
            smb_domain_range_low: null,
          });
          this.form.controls.smb_domain_domain_name.disable();
          this.form.controls.smb_domain_domain_sid.disable();
          this.form.controls.smb_domain_name.disable();
          this.form.controls.smb_domain_range_high.disable();
          this.form.controls.smb_domain_range_low.disable();
        } else {
          const ipaConfig = this.ipaConfig();
          this.form.patchValue({
            smb_domain_domain_name: ipaConfig?.smb_domain?.domain_name ?? null,
            smb_domain_domain_sid: ipaConfig?.smb_domain?.domain_sid ?? null,
            smb_domain_name: ipaConfig?.smb_domain?.name ?? null,
            smb_domain_range_high: ipaConfig?.smb_domain?.range_high ?? 200000000,
            smb_domain_range_low: ipaConfig?.smb_domain?.range_low ?? 100000001,
          });
          this.form.controls.smb_domain_domain_name.enable();
          this.form.controls.smb_domain_domain_sid.enable();
          this.form.controls.smb_domain_name.enable();
          this.form.controls.smb_domain_range_high.enable();
          this.form.controls.smb_domain_range_low.enable();
        }
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
