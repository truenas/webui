import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DeviceType } from 'app/enums/device-type.enum';
import { Device } from 'app/interfaces/device.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './isolated-gpu-pcis-form.component.html',
  styleUrls: ['./isolated-gpu-pcis-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedGpuPcisFormComponent implements OnInit {
  isFormLoading = false;
  formGroup = this.fb.group({
    isolated_gpu_pci_ids: [[] as string[]],
  });
  options$: Observable<Option[]> = this.ws.call('device.get_info', [DeviceType.Gpu]).pipe(
    tap((devices) => this.availableGpus = devices),
    map((devices) => devices.map((gpu) => ({ label: gpu.description, value: gpu.addr.pci_slot }))),
  );
  availableGpus: Device[];
  private isolatedGpuPciIds: string[];

  constructor(
    protected ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modal: IxSlideInService,
    private fb: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.ws.call('system.advanced.config').pipe(
      untilDestroyed(this),
    ).subscribe((config) => {
      this.isolatedGpuPciIds = config.isolated_gpu_pci_ids;
      this.formGroup.setValue({ isolated_gpu_pci_ids: config.isolated_gpu_pci_ids });
      this.cdr.markForCheck();
    });

    const gpusFormControl = this.formGroup.get('isolated_gpu_pci_ids');

    gpusFormControl.valueChanges.pipe(untilDestroyed(this)).subscribe((gpusValue: string[]) => {
      const selectedGpus = [...gpusValue];

      if (selectedGpus.length >= this.availableGpus?.length) {
        const prevSelectedGpus = [];
        for (const gpu of this.availableGpus) {
          if (this.isolatedGpuPciIds.findIndex((igpi) => igpi === gpu.addr.pci_slot) >= 0) {
            prevSelectedGpus.push(gpu);
          }
        }
        let manualValidateErrorMsg = '';
        const atLeastOneGpu = this.translate.instant('At least 1 GPU is required by the host for it’s functions.');
        const noGpuAvailable = this.translate.instant('With your selection, no GPU is available for the host to consume.');
        if (prevSelectedGpus.length > 0) {
          const gpus = '<li>' + prevSelectedGpus.map((gpu, index) => (index + 1) + '. ' + gpu.description).join('</li><li>') + '</li>';

          const selectedGpu = this.translate.instant('<p>Currently following GPU(s) have been isolated:<ol>{gpus}</ol></p>', { gpus });
          manualValidateErrorMsg = `${atLeastOneGpu} ${selectedGpu} ${noGpuAvailable}`;
        } else {
          manualValidateErrorMsg = `${atLeastOneGpu} ${noGpuAvailable}`;
        }
        gpusFormControl.setErrors({
          manualValidateError: true,
          manualValidateErrorMsg,
        });
      } else {
        gpusFormControl.setErrors(null);
      }
    });
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const isolatedGpuPciIds = this.formGroup.controls['isolated_gpu_pci_ids'].value;

    this.ws.call('system.advanced.update', [{ isolated_gpu_pci_ids: isolatedGpuPciIds }]).pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.sysGeneralService.refreshSysGeneral();
      this.modal.close();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.formGroup);
      this.cdr.markForCheck();
    });
  }
}
