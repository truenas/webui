import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnRadioGroupComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of, switchMap } from 'rxjs';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { stepCompletedSignal } from 'app/helpers/step-completed-signal.helper';
import { helptextIscsi } from 'app/helptext/sharing';
import { newOption, Option } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';

@Component({
  selector: 'ix-target-wizard-step',
  templateUrl: './target-wizard-step.component.html',
  styleUrls: ['./target-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnRadioGroupComponent,
    TnSelectComponent,
    AsyncPipe,
  ],
})
export class TargetWizardStepComponent {
  private iscsiService = inject(IscsiService);
  private translate = inject(TranslateService);
  private license = inject(LicenseService);
  formatter = inject(IxFormatterService);

  form = input.required<IscsiWizardComponent['form']['controls']['target']>();

  // Drives the stepper's "finished step" indicator.
  readonly completed = stepCompletedSignal(this.form);

  readonly helptextSharingIscsi = helptextIscsi;

  readonly targetOptions$ = this.iscsiService.getTargets().pipe(
    idNameArrayToOptions(),
    // `value` mixes the numeric target ids with the `newOption` string sentinel, so the
    // tn-select option type must span both (a bare `Option<number>[]` would reject the sentinel).
    switchMap((options) => of<Option<string | number>[]>([
      { label: this.translate.instant('Create New'), value: newOption },
      ...options,
    ])),
  );

  // A stable array, not an observable: tn-radio-group takes its options synchronously, and
  // rebuilding them per change-detection pass would re-create the whole option list.
  protected readonly modeOptions: Option<IscsiTargetMode>[] = [
    { label: this.translate.instant('iSCSI'), value: IscsiTargetMode.Iscsi },
    { label: this.translate.instant('Fibre Channel'), value: IscsiTargetMode.Fc },
  ];

  readonly hasFibreChannel = toSignal(this.license.hasFibreChannel$);

  get isNewTarget(): boolean {
    return this.form().enabled && this.form().value.target === newOption;
  }
}
