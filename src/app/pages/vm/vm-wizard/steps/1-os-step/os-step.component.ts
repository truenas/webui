import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  VmBootloader,
  VmDisplayType,
  vmDisplayTypeLabels,
  VmOs,
  vmOsLabels,
  VmTime,
  vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions, mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/vm/vm-wizard/vm-wizard';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import {
  forbiddenAsyncValues,
} from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { vmNamePattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-os-step',
  templateUrl: './os-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    os: [null as VmOs],
    hyperv_enlightenments: [false],
    name: ['',
      [Validators.required, Validators.pattern(vmNamePattern)],
      forbiddenAsyncValues(
        this.ws.call('vm.query').pipe(
          map((vms) => vms.map((vm) => vm.name)),
        ),
      ),
    ],
    description: [''],
    time: [VmTime.Local],
    bootloader: [VmBootloader.Uefi],
    shutdown_timeout: [90, [Validators.min(0)]],
    autostart: [true],
    enable_display: [true],
    display_type: [VmDisplayType.Vnc],
    bind: ['0.0.0.0', [Validators.required]],
  });

  readonly helptext = helptext;
  readonly VmOs = VmOs;

  readonly osOptions$ = of(mapToOptions(vmOsLabels, this.translate));
  readonly timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  readonly bootloaderOptions$ = this.ws.call('vm.bootloader_options').pipe(choicesToOptions());
  readonly displayTypeOptions$ = of(mapToOptions(vmDisplayTypeLabels, this.translate));
  readonly bindOptions$ = this.ws.call('vm.device.bind_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) { }

  getSummary(): SummarySection {
    const values = this.form.value;
    return [
      { label: this.translate.instant('Name'), value: values.name },
      { label: this.translate.instant('Guest Operating System'), value: values.os },
    ];
  }
}
