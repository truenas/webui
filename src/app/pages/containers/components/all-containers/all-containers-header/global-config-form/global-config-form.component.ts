import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError } from '@angular/material/form-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ipv4or6cidrValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import {
  ModalHeaderComponent,
} from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-global-config-form',
  templateUrl: './global-config-form.component.html',
  styleUrl: './global-config-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    ModalHeaderComponent,
    MatButton,
    MatCard,
    MatCardContent,
    MatError,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxIpInputWithNetmaskComponent,
  ],
})
export class GlobalConfigFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  slideInRef = inject<SlideInRef<ContainerGlobalConfig, boolean>>(SlideInRef);

  // LXC role is required for global container configuration (lxc.update, lxc.config)
  protected readonly requiredRoles = [Role.LxcConfigWrite];
  protected isLoading = signal(false);
  protected currentConfig = signal<ContainerGlobalConfig>(this.slideInRef.getData());
  protected readonly autoBridge = '[AUTO]';

  protected readonly form = this.formBuilder.nonNullable.group({
    bridge: [this.autoBridge],
    v4_network: [null as string | null],
    v6_network: [null as string | null],
    preferred_pool: [null as string | null],
  }, {
    validators: [],
  });

  /**
   * Wrapper for IP/CIDR validator that properly handles null values.
   *
   * Note: The upstream ipv4or6cidrValidator() only checks for empty string ('') and undefined,
   * but not null. Since our form fields use null as the initial value, we need this wrapper
   * to treat null as valid (field is optional). This ensures that an untouched field with
   * null value doesn't trigger validation errors.
   *
   * Returns a new validator instance on each call to avoid shared state issues between
   * multiple form controls (ipv4or6cidrValidator uses internal state via thisControl).
   */
  private ipCidrValidatorWrapper(): ValidatorFn {
    return (control) => {
      // If value is null, empty string, or undefined, it's valid (field is optional)
      if (control.value == null || control.value === '') {
        return null;
      }
      // Otherwise, validate the IP/CIDR format using the upstream validator
      return ipv4or6cidrValidator()(control);
    };
  }

  private readonly atLeastOneNetworkValidator: ValidatorFn = (formGroup) => {
    if (!formGroup) {
      return null;
    }
    const v4 = formGroup.get('v4_network')?.value;
    const v6 = formGroup.get('v6_network')?.value;

    // Check if either field has a non-empty value
    const hasV4 = v4 != null && String(v4).trim() !== '';
    const hasV6 = v6 != null && String(v6).trim() !== '';

    return hasV4 || hasV6
      ? null
      : { atLeastOneNetworkRequired: true };
  };

  protected bridgeOptions$ = this.api.call('lxc.bridge_choices').pipe(
    choicesToOptions(),
  );

  protected poolOptions$ = this.api.call('container.pool_choices').pipe(
    choicesToOptions(),
  );

  get isAutoBridge(): boolean {
    return this.form.controls.bridge.value === this.autoBridge;
  }

  get showNetworkError(): boolean {
    return this.isAutoBridge
      && this.form.hasError('atLeastOneNetworkRequired')
      && (this.form.controls.v4_network.touched || this.form.controls.v6_network.touched);
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isLoading.set(true);

    // Update network field validators when bridge changes
    this.form.controls.bridge.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.updateNetworkValidators();
    });

    // When either network field changes, re-validate form (for "at least one" validation)
    this.form.controls.v4_network.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.isAutoBridge) {
        // Update form validation without emitEvent to trigger validator check
        this.form.updateValueAndValidity();
      }
    });

    this.form.controls.v6_network.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.isAutoBridge) {
        // Update form validation without emitEvent to trigger validator check
        this.form.updateValueAndValidity();
      }
    });

    // Fetch fresh config from API to ensure we have the latest values
    this.api.call('lxc.config').pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.currentConfig.set(config);
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

  private updateNetworkValidators(): void {
    const v4Control = this.form.controls.v4_network;
    const v6Control = this.form.controls.v6_network;

    // Always clear validators first to avoid duplicates
    v4Control.clearValidators();
    v6Control.clearValidators();
    this.form.removeValidators(this.atLeastOneNetworkValidator);

    if (this.isAutoBridge) {
      // When bridge is automatic, at least one network (v4 or v6) must be specified
      // Add IP/CIDR format validation to both fields using wrapper that handles null values
      // These validators validate format only when a value is present (not null/empty)
      // Call wrapper function each time to get fresh validator instances (avoids shared state)
      v4Control.addValidators(this.ipCidrValidatorWrapper());
      v6Control.addValidators(this.ipCidrValidatorWrapper());
      // Add form-level "at least one" validation
      this.form.addValidators(this.atLeastOneNetworkValidator);
    }

    v4Control.updateValueAndValidity({ emitEvent: false });
    v6Control.updateValueAndValidity({ emitEvent: false });
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const controls = this.form.controls;
    const values: ContainerGlobalConfig = {
      // Transform [AUTO] back to empty string for the API
      bridge: controls.bridge.value === this.autoBridge ? '' : controls.bridge.value,
      // Convert empty strings to null for optional network fields
      v4_network: controls.v4_network.value?.trim() || null,
      v6_network: controls.v6_network.value?.trim() || null,
      preferred_pool: controls.preferred_pool.value,
    };

    this.api.call('lxc.update', [values])
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container settings updated'));
        this.slideInRef.close({
          response: true,
        });
      });
  }
}
