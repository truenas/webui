import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { GiB } from 'app/constants/bytes.constant';
import { inherit } from 'app/enums/with-inherit.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetDetails, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { isPropertyInherited, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './dataset-capacity-settings.component.html',
  styleUrls: ['./dataset-capacity-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacitySettingsComponent implements OnInit {
  readonly defaultQuotaWarning = 80;
  readonly defaultQuotaCritical = 95;

  form = this.formBuilder.group({
    refquota: [null as number, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptext.dataset_form_quota_too_small),
    )],
    refquota_warning: [this.defaultQuotaWarning, [
      Validators.min(0),
      Validators.max(100),
    ]],
    refquota_warning_inherit: [false],
    refquota_critical: [this.defaultQuotaCritical, [
      Validators.min(0),
      Validators.max(100),
    ]],
    refquota_critical_inherit: [false],

    quota: [null as number, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptext.dataset_form_quota_too_small),
    )],
    quota_warning: [this.defaultQuotaWarning, [
      Validators.min(0),
      Validators.max(100),
    ]],
    quota_warning_inherit: [false],
    quota_critical: [this.defaultQuotaCritical, [
      Validators.min(0),
      Validators.max(100),
    ]],
    quota_critical_inherit: [false],

    refreservation: [null as number],
    reservation: [null as number],
  });

  isLoading = false;

  readonly helptext = helptext;

  private oldValues: DatasetCapacitySettingsComponent['form']['value'];
  private readonly inheritRelations = {
    refquota_warning_inherit: 'refquota_warning',
    refquota_critical_inherit: 'refquota_critical',
    quota_warning_inherit: 'quota_warning',
    quota_critical_inherit: 'quota_critical',
  } as const;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private snackbarService: SnackbarService,
    private translate: TranslateService,
    private validators: IxValidatorsService,
    private slideInRef: IxSlideInRef<DatasetCapacitySettingsComponent>,
    @Inject(SLIDE_IN_DATA) public dataset: DatasetDetails,
  ) {
    this.setFormRelations();
  }

  ngOnInit(): void {
    if (this.dataset) {
      this.setDatasetForEdit();
    }
  }

  private setFormRelations(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((values) => {
      Object.entries(this.inheritRelations).forEach(([inheritField, valueField]) => {
        if (values[inheritField as keyof DatasetCapacitySettingsComponent['inheritRelations']]) {
          this.form.controls[valueField].disable({ emitEvent: false });
          this.form.controls[valueField].removeValidators(Validators.required);
        } else {
          this.form.controls[valueField].enable({ emitEvent: false });
          this.form.controls[valueField].addValidators(Validators.required);
        }
      });
    });
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  setDatasetForEdit(): void {
    this.oldValues = {
      refquota: this.dataset.refquota.parsed,
      refquota_warning: this.dataset.refquota_warning?.parsed ?? this.defaultQuotaWarning,
      refquota_warning_inherit: isPropertyInherited(this.dataset.refquota_warning),
      refquota_critical: this.dataset.refquota_critical?.parsed ?? this.defaultQuotaCritical,
      refquota_critical_inherit: isPropertyInherited(this.dataset.refquota_critical),
      quota: this.dataset.quota.parsed,
      quota_warning: this.dataset.quota_warning?.parsed ?? this.defaultQuotaWarning,
      quota_warning_inherit: isPropertyInherited(this.dataset.quota_warning),
      quota_critical: this.dataset.quota_critical?.parsed ?? this.defaultQuotaCritical,
      quota_critical_inherit: isPropertyInherited(this.dataset.quota_critical),
      refreservation: this.dataset.refreservation.parsed,
      reservation: this.dataset.reservation.parsed,
    };
    this.form.patchValue(this.oldValues);
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    const payload = this.getChangedFormValues();

    this.ws.call('pool.dataset.update', [this.dataset.id, payload])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.snackbarService.success(
            this.translate.instant('Dataset settings updated.'),
          );
          this.slideInRef.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private getChangedFormValues(): DatasetUpdate {
    const newValues = this.form.getRawValue();
    const oldValues = this.oldValues;

    const changedValues: DatasetUpdate = {};
    (['refquota', 'quota', 'refreservation', 'reservation'] as const).forEach((field) => {
      if (newValues[field] !== oldValues[field]) {
        changedValues[field] = newValues[field] || 0;
      }
    });

    (['refquota_warning', 'refquota_critical', 'quota_warning', 'quota_critical'] as const).forEach((field) => {
      if (newValues[field] !== oldValues[field]) {
        changedValues[field] = newValues[field];
      }
    });

    Object.entries(this.inheritRelations).forEach(([untypedInheritField, valueField]) => {
      const inheritField = untypedInheritField as keyof DatasetCapacitySettingsComponent['inheritRelations'];
      if (newValues[inheritField] === oldValues[inheritField]) {
        if (newValues[valueField] !== oldValues[valueField]) {
          // Inherit checkbox wasn't changed, but value was.
          changedValues[valueField] = newValues[valueField];
        }
        return;
      }

      // Inherit checkbox was changed.
      changedValues[valueField] = newValues[inheritField] ? inherit : newValues[valueField];
    });

    return changedValues;
  }
}
