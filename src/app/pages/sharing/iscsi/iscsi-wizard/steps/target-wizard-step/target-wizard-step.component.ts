import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { newOption, Option } from 'app/interfaces/option.interface';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiService } from 'app/services/iscsi.service';

@UntilDestroy()
@Component({
  selector: 'ix-target-wizard-step',
  templateUrl: './target-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IxSelectComponent,
    IxRadioGroupComponent,
  ],
})
export class TargetWizardStepComponent {
  form = input<IscsiWizardComponent['form']['controls']['target']>();

  readonly helptextSharingIscsi = helptextSharingIscsi;

  readonly targetOptions$ = this.iscsiService.getTargets().pipe(
    idNameArrayToOptions(),
    switchMap((options) => of([
      ...options,
      { label: this.translate.instant('Create New'), value: newOption },
    ])),
  );

  readonly modeOptions$: Observable<Option<IscsiTargetMode>[]> = of([
    { label: this.translate.instant('iSCSI'), value: IscsiTargetMode.Iscsi },
    { label: this.translate.instant('Fibre Channel'), value: IscsiTargetMode.Fc },
  ]);

  readonly hasFibreChannel = toSignal(this.iscsiService.hasFibreChannel());

  get isNewTarget(): boolean {
    return this.form().enabled && this.form().value.target === newOption;
  }

  constructor(
    private iscsiService: IscsiService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
  ) {}
}
