import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxFormHostForm,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-global-config-form',
  templateUrl: './global-config-form.component.html',
  styleUrl: './global-config-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    ReactiveFormsModule,
    TranslateModule,
    AsyncPipe,
    IxIpInputWithNetmaskComponent,
  ],
})
export class GlobalConfigFormComponent extends IxFormHostForm implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  /**
   * LXC role is required for global container configuration (lxc.update, lxc.config).
   * Public because the `<tn-side-panel>` host reads it to gate its footer Save.
   */
  readonly requiredRoles = [Role.LxcConfigWrite];
  protected readonly autoBridge = '[AUTO]';

  protected readonly form = this.formBuilder.nonNullable.group({
    bridge: [this.autoBridge],
    v4_network: [''],
    v6_network: [''],
    preferred_pool: [null as string | null],
  });

  protected bridgeOptions$ = this.api.call('lxc.bridge_choices').pipe(
    choicesToOptions(),
  );

  protected poolOptions$ = this.api.call('container.pool_choices').pipe(
    choicesToOptions(),
  );

  get isAutoBridge(): boolean {
    return this.form.controls.bridge.value === this.autoBridge;
  }

  ngOnInit(): void {
    // Wired before the load: `loadFormConfig`'s patch replays on retry, so a subscription set up
    // there would be registered twice.
    this.setUpValidatorWiring();

    // Fetch fresh config from API to ensure we have the latest values.
    this.loadFormConfig(this.api.call('lxc.config'), (config) => {
      this.form.patchValue({
        // Transform empty string from API to [AUTO] for the form
        bridge: config.bridge || this.autoBridge,
        v4_network: config.v4_network,
        v6_network: config.v6_network,
        preferred_pool: config.preferred_pool,
      });

      // Set initial validators based on bridge value
      this.updateNetworkValidators();
      this.form.markAsUntouched();
    });
  }

  private setUpValidatorWiring(): void {
    this.form.controls.bridge.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.updateNetworkValidators();
    });
  }

  /**
   * The automatic bridge is built from both networks. `lxc.update` takes each as a CIDR string and
   * refuses `null`, so neither can be cleared. Another bridge does not use them, and they are sent
   * back as loaded.
   */
  private updateNetworkValidators(): void {
    const networkControls = [this.form.controls.v4_network, this.form.controls.v6_network];

    networkControls.forEach((control) => {
      control.clearValidators();
      if (this.isAutoBridge) {
        // A fresh instance per control: the validator keeps the control it first sees.
        control.addValidators([Validators.required, ipv4or6cidrValidator()]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  protected handleSubmit = (): SubmitResult => {
    const controls = this.form.controls;
    const values = {
      // Transform [AUTO] back to empty string for the API
      bridge: controls.bridge.value === this.autoBridge ? '' : controls.bridge.value,
      v4_network: controls.v4_network.value.trim(),
      v6_network: controls.v6_network.value.trim(),
      preferred_pool: controls.preferred_pool.value,
    };

    return {
      request$: this.api.call('lxc.update', [values]),
      successMessage: this.translate.instant('Container settings updated'),
    };
  };
}
