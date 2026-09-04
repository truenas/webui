import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { IscsiTargetMode } from 'app/enums/iscsi.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import { newOption, Option } from 'app/interfaces/option.interface';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { EntitlementsService } from 'app/services/entitlements.service';
import { IscsiService } from 'app/services/iscsi.service';

@Component({
  selector: 'ix-target-wizard-step',
  templateUrl: './target-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    IxSelectComponent,
    IxRadioGroupComponent,
  ],
})
export class TargetWizardStepComponent {
  private iscsiService = inject(IscsiService);
  private translate = inject(TranslateService);
  private entitlements = inject(EntitlementsService);
  formatter = inject(IxFormatterService);

  form = input.required<IscsiWizardComponent['form']['controls']['target']>();

  readonly helptextSharingIscsi = helptextIscsi;

  readonly targetOptions$ = this.iscsiService.getTargets().pipe(
    idNameArrayToOptions(),
    switchMap((options) => of([
      { label: this.translate.instant('Create New'), value: newOption },
      ...options,
    ])),
  );

  readonly modeOptions$: Observable<Option<IscsiTargetMode>[]> = of([
    { label: this.translate.instant('iSCSI'), value: IscsiTargetMode.Iscsi },
    { label: this.translate.instant('Fibre Channel'), value: IscsiTargetMode.Fc },
  ]);

  // Entitlement alone by design (NAS-143012): `fc.capable` is not consulted here.
  readonly hasFibreChannel = toSignal(this.entitlements.entitled$(EntitlementFeature.FibreChannel));

  get isNewTarget(): boolean {
    return this.form().enabled && this.form().value.target === newOption;
  }
}
