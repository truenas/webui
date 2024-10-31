import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  VmBootloader,
  VmDisplayType,
  VmOs,
  vmOsLabels,
  VmTime,
  vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  forbiddenAsyncValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { vmNamePattern } from 'app/pages/vm/utils/vm-form-patterns.constant';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-os-step',
  templateUrl: './os-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    TranslateModule,
  ],
})
export class OsStepComponent implements SummaryProvider {
  form = this.formBuilder.group({
    os: [null as VmOs],
    hyperv_enlightenments: [false],
    name: ['',
      [Validators.required, Validators.pattern(vmNamePattern)],
      forbiddenAsyncValues(
        this.ws.call('vm.query', [[], { select: ['name'], order_by: ['name'] }]).pipe(
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
    display_type: [VmDisplayType.Spice],
    bind: ['0.0.0.0', [Validators.required]],
    password: ['', Validators.required],
  });

  readonly helptext = helptextVmWizard;
  readonly VmOs = VmOs;

  readonly osOptions$ = of(mapToOptions(vmOsLabels, this.translate));
  readonly timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  readonly bootloaderOptions$ = this.ws.call('vm.bootloader_options').pipe(choicesToOptions());
  readonly bindOptions$ = this.ws.call('vm.device.bind_choices').pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {
    this.form.controls.enable_display.valueChanges.pipe(untilDestroyed(this)).subscribe((isEnabled) => {
      if (isEnabled) {
        this.form.controls.password.enable();
        this.form.controls.bind.enable();
        this.form.controls.display_type.enable();
      } else {
        this.form.controls.password.disable();
        this.form.controls.bind.disable();
        this.form.controls.display_type.disable();
      }
    });
  }

  getSummary(): SummarySection {
    const values = this.form.value;
    return [
      { label: this.translate.instant('Name'), value: values.name },
      { label: this.translate.instant('Guest Operating System'), value: values.os },
    ];
  }
}
