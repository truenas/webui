import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { GpuService } from 'app/services/gpu/gpu.service';
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
})
export class IsolatedGpusFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;

  formGroup = new FormGroup({
    isolated_gpu_pci_ids: new FormControl<string[]>([], {
      asyncValidators: [this.gpuValidator.validateGpu],
    }),
  });
  readonly options$ = this.gpuService.getGpuOptions();

  constructor(
    protected ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private gpuValidator: IsolatedGpuValidatorService,
    private gpuService: GpuService,
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
