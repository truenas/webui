import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
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
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  VmBootloader,
  VmOs,
  vmOsLabels,
  VmTime,
  vmTimeNames,
} from 'app/enums/vm.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';
import { helptextVmWizard } from 'app/helptext/vm/vm-wizard/vm-wizard';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  forbiddenAsyncValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { SummaryProvider, SummarySection } from 'app/modules/summary/summary.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { vmNamePattern } from 'app/pages/vm/utils/vm-form-patterns.constant';

@Component({
  selector: 'ix-os-step',
  templateUrl: './os-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class OsStepComponent implements SummaryProvider {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.nonNullable.group({
    os: [null as VmOs | null, Validators.required],
    hyperv_enlightenments: [false],
    name: ['',
      [Validators.required, Validators.pattern(vmNamePattern)],
      forbiddenAsyncValues(
        this.api.call('vm.query', [[], { select: ['name'], order_by: ['name'] }]).pipe(
          map((vms) => vms.map((vm) => vm.name)),
        ),
      ),
    ],
    description: [''],
    time: [VmTime.Local],
    bootloader: [VmBootloader.Uefi],
    enable_secure_boot: [false],
    trusted_platform_module: [false],
    shutdown_timeout: [90, [Validators.min(0)]],
    autostart: [true],
    enable_vnc: [true],
    vnc_bind: ['0.0.0.0', [Validators.required]],
    vnc_password: ['', [Validators.required, Validators.maxLength(8)]],
  });

  // Drives the stepper's linear gating (replaces mat's [stepControl]).
  readonly completed = stepCompletedSignal(this.form);

  readonly helptext = helptextVmWizard;
  readonly VmOs = VmOs;
  protected readonly InputType = InputType;

  readonly osOptions$ = of(mapToOptions(vmOsLabels, this.translate));
  readonly timeOptions$ = of(mapToOptions(vmTimeNames, this.translate));
  readonly bootloaderOptions$ = this.api.call('vm.bootloader_options').pipe(choicesToOptions());
  readonly bindOptions$ = this.api.call('vm.device.bind_choices').pipe(choicesToOptions());

  constructor() {
    // Handle VNC display controls
    this.form.controls.enable_vnc.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isEnabled) => {
      if (isEnabled) {
        this.form.controls.vnc_password.setValidators([Validators.required, Validators.maxLength(8)]);
        this.form.controls.vnc_bind.setValidators([Validators.required]);
        this.form.controls.vnc_bind.enable();
        this.form.controls.vnc_password.enable();
      } else {
        this.form.controls.vnc_password.clearValidators();
        this.form.controls.vnc_bind.clearValidators();
        this.form.controls.vnc_bind.disable();
        this.form.controls.vnc_password.disable();
      }
      this.form.controls.vnc_password.updateValueAndValidity();
      this.form.controls.vnc_bind.updateValueAndValidity();
    });
  }

  getSummary(): SummarySection {
    const values = this.form.getRawValue();
    return [
      { label: this.translate.instant('Name'), value: values.name },
      { label: this.translate.instant('Guest Operating System'), value: values.os || '' },
    ];
  }
}
