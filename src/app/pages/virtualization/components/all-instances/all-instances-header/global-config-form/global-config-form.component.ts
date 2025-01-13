import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { VirtualizationGlobalConfig, VirtualizationGlobalConfigUpdate } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-config-form',
  templateUrl: './global-config-form.component.html',
  standalone: true,
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
export class GlobalConfigFormComponent {
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected isLoading = signal(false);
  protected readonly autoBridge = '[AUTO]';

  protected readonly form = this.formBuilder.nonNullable.group({
    pool: [''],
    bridge: [this.autoBridge],
    v4_network: [null as string | null],
    v6_network: [null as string | null],
  });

  protected poolOptions$ = this.api.call('virt.global.pool_choices').pipe(choicesToOptions());
  protected bridgeOptions$ = this.api.call('virt.global.bridge_choices').pipe(choicesToOptions());

  get isAutoBridge(): boolean {
    return this.form.controls.bridge.value === this.autoBridge;
  }

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<VirtualizationGlobalConfig, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    const currentConfig = this.slideInRef.getData();

    this.form.setValue({
      pool: currentConfig.pool || '',
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
      this.api.job('virt.global.update', [values]),
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
          response: true,
          error: false,
        });
      });
  }
}
