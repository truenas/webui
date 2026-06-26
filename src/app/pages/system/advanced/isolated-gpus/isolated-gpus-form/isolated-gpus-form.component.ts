import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ChangeDetectorRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CriticalGpuPreventionService } from 'app/services/gpu/critical-gpu-prevention.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-isolated-gpus-form',
  templateUrl: './isolated-gpus-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class IsolatedGpusFormComponent extends SidePanelForm implements OnInit {
  protected api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private gpuValidator = inject(IsolatedGpuValidatorService);
  private gpuService = inject(GpuService);
  private snackbar = inject(SnackbarService);
  private criticalGpuPrevention = inject(CriticalGpuPreventionService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected isFormLoading = signal(false);

  form = new FormGroup({
    isolated_gpu_pci_ids: new FormControl<string[]>([], {
      nonNullable: true,
      asyncValidators: [this.gpuValidator.validateGpu],
    }),
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  criticalGpus = new Map<string, string>(); // Maps pci_slot to critical_reason

  readonly options$ = this.gpuService.getGpuOptions();

  ngOnInit(): void {
    this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.form.setValue({
        isolated_gpu_pci_ids: config.isolated_gpu_pci_ids,
      });
      this.cdr.markForCheck();
    });

    // Setup critical GPU prevention
    this.criticalGpus = this.criticalGpuPrevention.setupCriticalGpuPrevention(
      this.form.controls.isolated_gpu_pci_ids,
      this.destroyRef,
      this.translate.instant('Cannot Isolate GPU'),
      this.translate.instant('System critical GPUs cannot be isolated'),
    );
  }

  protected onSubmit(): void {
    this.isFormLoading.set(true);
    const { isolated_gpu_pci_ids: isolatedGpuPciIds } = this.form.value;

    this.api.call('system.advanced.update_gpu_pci_ids', [isolatedGpuPciIds]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
