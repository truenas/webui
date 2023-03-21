import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

@Component({
  selector: 'ix-gpu-step',
  templateUrl: './gpu-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GpuStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    hide_from_msr: [false],
    ensure_display_device: [true],
    gpus: [[] as string[], {
      asyncValidators: [this.gpuValidator.validateGpu],
    }],
  });

  readonly helptext = helptext;
  readonly gpuOptions$ = this.gpuService.getGpuOptions();

  constructor(
    private formBuilder: FormBuilder,
    private gpuValidator: IsolatedGpuValidatorService,
    private gpuService: GpuService,
    private translate: TranslateService,
  ) {}

  getSummary(): SummarySection {
    const gpusSelected = this.form.value.gpus.length;
    if (gpusSelected === 0) {
      return [];
    }

    return [
      {
        label: this.translate.instant('GPU'),
        value: this.translate.instant('{n, plural, one {# GPU} other {# GPUs}} isolated', { n: gpusSelected }),
      },
    ];
  }
}
