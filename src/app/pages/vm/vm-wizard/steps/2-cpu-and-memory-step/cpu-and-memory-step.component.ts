import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnInputComponent,
  TnSelectComponent,
  TnStepperNextDirective,
  TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { VmCpuMode, vmCpuModeLabels } from 'app/enums/vm.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cpu-and-memory-step',
  templateUrl: './cpu-and-memory-step.component.html',
  styleUrls: ['./cpu-and-memory-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService],
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperPreviousDirective,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class CpuAndMemoryStepComponent implements OnInit, SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private cpuValidator = inject(CpuValidatorService);
  private validator = inject(IxValidatorsService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    vcpus: [1, {
      validators: [Validators.required, Validators.min(1)],
      asyncValidators: [this.cpuValidator.createValidator()],
    }],
    cores: [1, {
      validators: [Validators.required, Validators.min(1)],
      asyncValidators: [this.cpuValidator.createValidator()],
    }],
    threads: [1, {
      validators: [Validators.required, Validators.min(1)],
      asyncValidators: [this.cpuValidator.createValidator()],
    }],
    cpuset: ['', Validators.pattern(vmCpusetPattern)],
    pin_vcpus: [false],
    cpu_mode: [VmCpuMode.Custom],
    cpu_model: [''],
    memory: [512 * MiB, [
      Validators.required,
      this.validator.withMessage(
        Validators.min(256 * MiB),
        this.translate.instant(helptextVmWizard.memory_size_err),
      ),
    ]],
    min_memory: [null as number | null],
    nodeset: ['', Validators.pattern(vmNodesetPattern)],
  });

  maxVcpus: number;

  // Drives the stepper's linear gating (replaces mat's [stepControl]).
  readonly completed = stepCompletedSignal(this.form);

  readonly helptext = helptextVmWizard;
  protected readonly InputType = InputType;

  readonly cpuModes$ = of(mapToOptions(vmCpuModeLabels, this.translate));
  readonly cpuModels$ = this.api.call('vm.cpu_model_choices').pipe(choicesToOptions());

  get isCpuCustom(): boolean {
    return this.form.value.cpu_mode === VmCpuMode.Custom;
  }

  ngOnInit(): void {
    this.loadMaxSupportedVcpus();
    this.setPinVcpusRelation();
  }

  getSummary(): SummarySection {
    const values = this.form.value;

    const cpuConfiguration = [
      this.translate.instant('{n, plural, one {# CPU} other {# CPUs}}', { n: values.vcpus }),
      this.translate.instant('{n, plural, one {# core} other {# cores}}', { n: values.cores }),
      this.translate.instant('{n, plural, one {# thread} other {# threads}}', { n: values.threads }),
    ].join(', ');

    const summary = [
      {
        label: this.translate.instant('CPU Configuration'),
        value: cpuConfiguration,
      },
      {
        label: this.translate.instant('CPU Mode'),
        value: values.cpu_mode
          ? vmCpuModeLabels.get(values.cpu_mode) || ''
          : '',
      },
    ];

    if (values.cpu_mode === VmCpuMode.Custom) {
      summary.push({
        label: this.translate.instant('CPU Model'),
        value: values.cpu_model || '',
      });
    }

    summary.push({
      label: this.translate.instant('Memory'),
      value: values.memory ? buildNormalizedFileSize(values.memory) : '',
    });

    if (values.min_memory) {
      summary.push({
        label: this.translate.instant('Minimum Memory'),
        value: buildNormalizedFileSize(values.min_memory),
      });
    }

    return summary;
  }

  private loadMaxSupportedVcpus(): void {
    this.cpuValidator.getMaxVcpus()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((maxVcpus) => {
        this.maxVcpus = maxVcpus;
        this.cdr.markForCheck();
      });
  }

  private setPinVcpusRelation(): void {
    this.form.controls.cpuset.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cpuset) => {
        if (cpuset) {
          this.form.controls.pin_vcpus.enable();
        } else {
          this.form.controls.pin_vcpus.disable();
        }
      });
  }
}
