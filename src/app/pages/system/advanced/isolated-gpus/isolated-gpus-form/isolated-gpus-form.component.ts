import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
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
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class IsolatedGpusFormComponent extends IxFormHostForm implements OnInit {
  protected api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private gpuValidator = inject(IsolatedGpuValidatorService);
  private gpuService = inject(GpuService);
  private criticalGpuPrevention = inject(CriticalGpuPreventionService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected readonly form = new FormGroup({
    isolated_gpu_pci_ids: new FormControl<string[]>([], {
      nonNullable: true,
      asyncValidators: [this.gpuValidator.validateGpu],
    }),
  });

  criticalGpus = new Map<string, string>(); // Maps pci_slot to critical_reason

  readonly options$ = this.gpuService.getGpuOptions();

  ngOnInit(): void {
    // Wired before the load so a replayed `loadFormConfig` patch can't register it twice.
    this.criticalGpus = this.criticalGpuPrevention.setupCriticalGpuPrevention(
      this.form.controls.isolated_gpu_pci_ids,
      this.destroyRef,
      this.translate.instant('Cannot Isolate GPU'),
      this.translate.instant('System critical GPUs cannot be isolated'),
    );

    this.loadFormConfig(this.store$.pipe(waitForAdvancedConfig), (config) => {
      this.form.setValue({
        isolated_gpu_pci_ids: config.isolated_gpu_pci_ids,
      });
    });
  }

  protected handleSubmit = (): SubmitResult => {
    const { isolated_gpu_pci_ids: isolatedGpuPciIds } = this.form.value;

    return {
      request$: this.api.call('system.advanced.update_gpu_pci_ids', [isolatedGpuPciIds]),
      successMessage: this.translate.instant('Settings saved'),
      onSuccess: () => this.store$.dispatch(advancedConfigUpdated()),
    };
  };
}
