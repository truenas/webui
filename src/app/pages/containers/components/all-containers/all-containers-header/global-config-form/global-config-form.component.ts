import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    ModalHeaderComponent,
    MatButton,
    MatCard,
    MatCardContent,
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
  });

  // Store validators as class members so we can reference them when adding/removing
  private readonly ipCidrValidator = ipv4or6cidrValidator();

  private readonly atLeastOneNetworkValidator: ValidatorFn = () => {
    const v4 = this.form.controls.v4_network.value;
    const v6 = this.form.controls.v6_network.value;
    return v4?.trim() || v6?.trim()
      ? null
      : { atLeastOneNetworkRequired: true };
  };

  // Group validators together for cleaner add/remove calls
  private readonly networkValidators = [this.ipCidrValidator, this.atLeastOneNetworkValidator];

  protected bridgeOptions$ = this.api.call('lxc.bridge_choices').pipe(
    choicesToOptions(),
  );

  protected poolOptions$ = this.api.call('container.pool_choices').pipe(
    choicesToOptions(),
  );

  get isAutoBridge(): boolean {
    return this.form.controls.bridge.value === this.autoBridge;
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

    // When either network field changes, re-validate both (for "at least one" validation)
    this.form.controls.v4_network.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.isAutoBridge) {
        this.form.controls.v6_network.updateValueAndValidity({ emitEvent: false });
      }
    });

    this.form.controls.v6_network.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      if (this.isAutoBridge) {
        this.form.controls.v4_network.updateValueAndValidity({ emitEvent: false });
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

    if (this.isAutoBridge) {
      // When bridge is automatic, at least one network (v4 or v6) must be specified
      // Add both IP/CIDR format validation and "at least one" validation
      v4Control.addValidators(this.networkValidators);
      v6Control.addValidators(this.networkValidators);
    } else {
      // When bridge is not automatic, remove our custom validators
      v4Control.removeValidators(this.networkValidators);
      v6Control.removeValidators(this.networkValidators);
    }

    v4Control.updateValueAndValidity({ emitEvent: false });
    v6Control.updateValueAndValidity({ emitEvent: false });
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
