import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnFormFieldComponent, TnSelectComponent } from '@truenas/ui-components';
import { Observable, of, switchMap } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import { newOption, Option } from 'app/interfaces/option.interface';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';
import { LicenseService } from 'app/services/license.service';

@Component({
  selector: 'ix-target-wizard-step',
  templateUrl: './target-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormFieldComponent,
    TnSelectComponent,
    IxRadioGroupComponent,
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
  readonly completed = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) => form.statusChanges.pipe(startWith(form.status))),
      map(() => this.form().valid),
    ),
    { initialValue: false },
  );

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

  readonly modeOptions$: Observable<Option<IscsiTargetMode>[]> = of([
    { label: this.translate.instant('iSCSI'), value: IscsiTargetMode.Iscsi },
    { label: this.translate.instant('Fibre Channel'), value: IscsiTargetMode.Fc },
  ]);

  readonly hasFibreChannel = toSignal(this.license.hasFibreChannel$);

  get isNewTarget(): boolean {
    return this.form().enabled && this.form().value.target === newOption;
  }
}
