import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { VirtualizationGlobalConfig, VirtualizationGlobalConfigUpdate } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import {
  ModalHeader2Component,
} from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-config-form',
  templateUrl: './global-config-form.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    ModalHeader2Component,
    MatButton,
    MatCard,
    MatCardContent,
    IxRadioGroupComponent,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxIpInputWithNetmaskComponent,
  ],
})
export class GlobalConfigFormComponent {
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected isLoading = signal(false);
  protected readonly autoBridge = '[AUTO]';

  protected readonly form = this.formBuilder.nonNullable.group({
    pool: [''],
    bridge: [this.autoBridge],
    v4_network: [null as string],
    v6_network: [null as string],
  });

  protected poolOptions$ = this.ws.call('virt.global.pool_choices').pipe(choicesToOptions());
  protected bridgeOptions$ = this.ws.call('virt.global.bridge_choices').pipe(choicesToOptions());

  get isAutoBridge(): boolean {
    return this.form.controls.bridge.value === this.autoBridge;
  }

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private slideInRef: ChainedRef<VirtualizationGlobalConfig>,
  ) {
    const currentConfig = this.slideInRef.getData();

    this.form.setValue({
      pool: currentConfig.pool,
      bridge: !currentConfig.bridge ? this.autoBridge : currentConfig.bridge,
      v4_network: currentConfig.v4_network,
      v6_network: currentConfig.v6_network,
    });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const controls = this.form.controls;
    const values: VirtualizationGlobalConfigUpdate = {
      pool: controls.pool.value,
      bridge: controls.bridge.value,
      v4_network: (!this.isAutoBridge || !controls.v4_network.value) ? null : controls.v4_network.value,
      v6_network: (!this.isAutoBridge || !controls.v6_network.value) ? null : controls.v6_network.value,
    };

    this.dialogService.jobDialog(
      this.ws.job('virt.global.update', [values]),
      { title: this.translate.instant('Updating settings') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Virtualization settings updated'));
        this.slideInRef.close({
          response: undefined,
          error: false,
        });
      });
  }
}
