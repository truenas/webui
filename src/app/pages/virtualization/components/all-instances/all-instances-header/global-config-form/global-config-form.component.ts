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
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import {
  IxModalHeader2Component,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header2/ix-modal-header2.component';
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
    IxModalHeader2Component,
    MatButton,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
  ],
})
export class GlobalConfigFormComponent {
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
  protected isLoading = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    pool: [''],
  });

  protected poolOptions$ = this.ws.call('virt.global.pool_choices').pipe(choicesToOptions());

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
    });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const values = this.form.value as VirtualizationGlobalConfigUpdate;

    this.dialogService.jobDialog(
      this.ws.job('virt.global.update', [values]),
      {
        title: this.translate.instant('Updating settings'),
      },
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
