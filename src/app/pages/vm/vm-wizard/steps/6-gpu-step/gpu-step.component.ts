import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { GpuService } from 'app/services/gpu/gpu.service';
import { IsolatedGpuValidatorService } from 'app/services/gpu/isolated-gpu-validator.service';

@Component({
  selector: 'ix-gpu-step',
  templateUrl: './gpu-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class GpuStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    hide_from_msr: [false],
    ensure_display_device: [true],
    gpus: [[] as string[], {
      asyncValidators: [this.gpuValidator.validateGpu],
    }],
  });

  readonly helptext = helptextVmWizard;
  readonly gpuOptions$ = this.gpuService.getGpuOptions();

  constructor(
    private formBuilder: FormBuilder,
    private gpuValidator: IsolatedGpuValidatorService,
    private translate: TranslateService,
    private gpuService: GpuService,
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
