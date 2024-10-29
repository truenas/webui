import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { map, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-isolated-gpus-form',
  templateUrl: './isolated-gpus-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class IsolatedGpusFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;

  formGroup = new FormGroup({
    isolated_gpu_pci_ids: new FormControl<string[]>([], {
      asyncValidators: [this.gpuValidator.validateGpu],
    }),
  });

  readonly options$ = this.ws.call('system.advanced.get_gpu_pci_choices').pipe(map((choices) => {
    return Object.entries(choices).map(
      ([value, label]) => ({ value: label, label: value }),
    );
  }));

  constructor(
    protected ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private gpuValidator: IsolatedGpuValidatorService,
    private snackbar: SnackbarService,
    private chainedRef: ChainedRef<unknown>,
  ) { }

  ngOnInit(): void {
    this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      untilDestroyed(this),
    ).subscribe((config) => {
      this.formGroup.setValue({ isolated_gpu_pci_ids: config.isolated_gpu_pci_ids });
      this.cdr.markForCheck();
    });
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const isolatedGpuPciIds = this.formGroup.controls.isolated_gpu_pci_ids.value;

    this.ws.call('system.advanced.update_gpu_pci_ids', [isolatedGpuPciIds]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.chainedRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.formGroup);
        this.cdr.markForCheck();
      },
    });
  }
}
