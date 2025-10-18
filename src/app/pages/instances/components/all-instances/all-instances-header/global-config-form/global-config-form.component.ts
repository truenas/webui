import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
import {
  ModalHeaderComponent,
} from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
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
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  slideInRef = inject<SlideInRef<ContainerGlobalConfig, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.LxcConfigWrite];
  protected isLoading = signal(false);
  protected currentConfig = signal<ContainerGlobalConfig>(this.slideInRef.getData());
  protected readonly autoBridge = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    bridge: [this.autoBridge],
    v4_network: [null as string | null, Validators.required],
    v6_network: [null as string | null],
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

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isLoading.set(true);

    // Fetch fresh config from API to ensure we have the latest values
    this.api.call('lxc.config').pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      untilDestroyed(this),
    ).subscribe((config) => {
      this.currentConfig.set(config);
      this.form.patchValue({
        bridge: config.bridge ?? this.autoBridge,
        v4_network: config.v4_network,
        v6_network: config.v6_network,
        preferred_pool: config.preferred_pool,
      });
    });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const controls = this.form.controls;
    const values: ContainerGlobalConfig = {
      bridge: controls.bridge.value,
      v4_network: controls.v4_network.value,
      v6_network: controls.v6_network.value,
      preferred_pool: controls.preferred_pool.value,
    };

    this.api.call('lxc.update', [values])
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Virtualization settings updated'));
        this.slideInRef.close({
          response: true,
        });
      });
  }
}
