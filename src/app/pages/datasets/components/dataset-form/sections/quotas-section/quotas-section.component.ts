import {
  ChangeDetectionStrategy, Component, Input, OnInit, output,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { pickBy } from 'lodash-es';
import { GiB } from 'app/constants/bytes.constant';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';

const warning = 80;
const critical = 95;

@UntilDestroy()
@Component({
  selector: 'ix-quotas-section',
  styleUrls: ['./quotas-section.component.scss'],
  templateUrl: './quotas-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    IxInputComponent,
    TranslateModule,
    IxCheckboxComponent,
    ReactiveFormsModule,
  ],
})
export class QuotasSectionComponent implements OnInit {
  @Input() parent: Dataset;

  readonly formValidityChange = output<boolean>();

  readonly form = this.formBuilder.group({
    refquota: [null as number, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptextDatasetForm.dataset_form_quota_too_small),
    )],
    refquota_warning: [warning, [Validators.min(0), Validators.max(100)]],
    refquota_warning_inherit: [true],
    refquota_critical: [critical, [Validators.min(0), Validators.max(100)]],
    refquota_critical_inherit: [true],
    refreservation: [null as number],
    quota: [null as number, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptextDatasetForm.dataset_form_quota_too_small),
    )],
    quota_warning: [warning, [Validators.min(0), Validators.max(100)]],
    quota_warning_inherit: [true],
    quota_critical: [critical, [Validators.min(0), Validators.max(100)]],
    quota_critical_inherit: [true],
    reservation: [null as number],
  });

  readonly helptext = helptextDatasetForm;

  constructor(
    private formBuilder: FormBuilder,
    public formatter: IxFormatterService,
    private validators: IxValidatorsService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.setFormRelations();

    this.form.statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      this.formValidityChange.emit(status === 'VALID');
    });
  }

  getPayload(): Partial<DatasetCreate> {
    const values = this.form.value;
    const payload: Partial<DatasetCreate> = pickBy(values, (value, key) => {
      return [
        'refquota',
        'refreservation',
        'quota',
        'reservation',
      ].includes(key) && value !== null;
    });

    if (!values.refquota_warning_inherit) {
      payload.refquota_warning = values.refquota_warning;
    }
    if (!values.refquota_critical_inherit) {
      payload.refquota_critical = values.refquota_critical;
    }
    if (!values.quota_warning_inherit) {
      payload.quota_warning = values.quota_warning;
    }
    if (!values.quota_critical_inherit) {
      payload.quota_critical = values.quota_critical;
    }
    return payload;
  }

  private setFormRelations(): void {
    this.form.controls.refquota_warning_inherit.valueChanges.pipe(untilDestroyed(this)).subscribe((isInherit) => {
      this.setDisabledForControl(this.form.controls.refquota_warning, isInherit);
    });

    this.form.controls.refquota_critical_inherit.valueChanges.pipe(untilDestroyed(this)).subscribe((isInherit) => {
      this.setDisabledForControl(this.form.controls.refquota_critical, isInherit);
    });

    this.form.controls.quota_warning_inherit.valueChanges.pipe(untilDestroyed(this)).subscribe((isInherit) => {
      this.setDisabledForControl(this.form.controls.quota_warning, isInherit);
    });

    this.form.controls.quota_critical_inherit.valueChanges.pipe(untilDestroyed(this)).subscribe((isInherit) => {
      this.setDisabledForControl(this.form.controls.quota_critical, isInherit);
    });

    this.form.controls.refquota_warning_inherit.updateValueAndValidity();
    this.form.controls.refquota_critical_inherit.updateValueAndValidity();
    this.form.controls.quota_warning_inherit.updateValueAndValidity();
    this.form.controls.quota_critical_inherit.updateValueAndValidity();
  }

  private setDisabledForControl(control: AbstractControl, isDisabled: boolean): void {
    if (isDisabled) {
      control.disable();
    } else {
      control.enable();
    }
  }
}
