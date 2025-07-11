import {
  ChangeDetectionStrategy,
  Component,
  output,
  OnInit,
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
import { IdmapBackend } from 'app/enums/directory-services.enum';
import { IpaConfig, IpaSmbDomain } from 'app/interfaces/ipa-config.interface';
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
  readonly configurationChanged = output<IpaConfig>();

  form = this.fb.group({
    target_server: [null, Validators.required],
    hostname: [null, Validators.required],
    domain: [null, Validators.required],
    basedn: [null, Validators.required],
    validate_certificates: [false, Validators.required],

    use_default_smb_domain: [true],
    smb_domain_name: [null as string, [
      Validators.required,
      Validators.pattern(/^(?![0-9]*$)[a-zA-Z0-9.-_!@#$%^&()'{}~]{1,15}$/),
    ]],
    smb_domain_domain_name: [null as string, Validators.required],
    smb_domain_sid: [null as string, Validators.required],
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
    this.form.controls.use_default_smb_domain.valueChanges.pipe(startWith(true)),
  );

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.watchForFormChanges();
  }

  private watchForFormChanges(): void {
    this.form.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
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
          domain_sid: formValue.smb_domain_sid,
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
