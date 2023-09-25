import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { VmCpuMode, vmCpuModeLabels } from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { CpuValidatorService } from 'app/pages/vm/utils/cpu-validator.service';
import { vmCpusetPattern, vmNodesetPattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cpu-and-memory-step',
  templateUrl: './cpu-and-memory-step.component.html',
  styleUrls: ['./cpu-and-memory-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CpuValidatorService],
})
export class CpuAndMemoryStepComponent implements OnInit, SummaryProvider {
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
        this.translate.instant(helptext.memory_size_err),
      ),
    ]],
    min_memory: [null as number],
    nodeset: ['', Validators.pattern(vmNodesetPattern)],
  });

  maxVcpus: number;

  readonly helptext = helptext;

  readonly cpuModes$ = of(mapToOptions(vmCpuModeLabels, this.translate));
  readonly cpuModels$ = this.ws.call('vm.cpu_model_choices').pipe(choicesToOptions());

  constructor(
    public formatter: IxFormatterService,
    private formBuilder: FormBuilder,
    private cpuValidator: CpuValidatorService,
    private validator: IxValidatorsService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
  ) {}

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
        value: vmCpuModeLabels.get(values.cpu_mode),
      },
    ];

    if (values.cpu_mode === VmCpuMode.Custom) {
      summary.push({
        label: this.translate.instant('CPU Model'),
        value: values.cpu_model,
      });
    }

    summary.push({
      label: this.translate.instant('Memory'),
      value: filesize(values.memory, { standard: 'iec' }),
    });

    if (values.min_memory) {
      summary.push({
        label: this.translate.instant('Minimum Memory'),
        value: filesize(values.min_memory, { standard: 'iec' }),
      });
    }

    return summary;
  }

  private loadMaxSupportedVcpus(): void {
    this.ws.call('vm.maximum_supported_vcpus').pipe(untilDestroyed(this)).subscribe((maxVcpus) => {
      this.maxVcpus = maxVcpus;
      this.cdr.markForCheck();
    });
  }

  private setPinVcpusRelation(): void {
    this.form.controls.cpuset.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((cpuset) => {
        if (cpuset) {
          this.form.controls.pin_vcpus.enable();
        } else {
          this.form.controls.pin_vcpus.disable();
        }
      });
  }
}
