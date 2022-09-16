import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { inherit } from 'app/enums/with-inherit.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetDetails, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { isPropertyInherited, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const oneGb = 1024 * 1024 * 1024;

@UntilDestroy()
@Component({
  templateUrl: './dataset-capacity-settings.component.html',
  styleUrls: ['./dataset-capacity-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetCapacitySettingsComponent {
  readonly defaultWarning = 80;
  readonly defaultCritical = 95;

  form = this.formBuilder.group({
    refquota: [null as number, Validators.min(oneGb)],
    refquota_warning: [this.defaultWarning, [
      Validators.min(0),
      Validators.max(100),
    ]],
    refquota_warning_inherit: [false],
    refquota_critical: [this.defaultCritical, [
      Validators.min(0),
      Validators.max(100),
    ]],
    refquota_critical_inherit: [false],

    quota: [null as number, Validators.min(oneGb)],
    quota_warning: [this.defaultWarning, [
      Validators.min(0),
      Validators.max(100),
    ]],
    quota_warning_inherit: [false],
    quota_critical: [this.defaultCritical, [
      Validators.min(0),
      Validators.max(100),
    ]],
    quota_critical_inherit: [false],

    refreservation: [null as number],
    reservation: [null as number],
  });

  isLoading = false;
  dataset: DatasetDetails;

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
    private validationService: IxValidatorsService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private snackbarService: SnackbarService,
    private translate: TranslateService,
    private slideIn: IxSlideInService,
  ) {
    this.setFormRelations();
  }

  get isRoot(): boolean {
    return isRootDataset(this.dataset);
  }

  setDatasetForEdit(dataset: DatasetDetails): void {
    this.dataset = dataset;
    this.oldValues = {
      refquota: dataset.refquota.parsed,
      refquota_warning: dataset.refquota_warning?.parsed ?? this.defaultWarning,
      refquota_warning_inherit: isPropertyInherited(dataset.refquota_warning),
      refquota_critical: dataset.refquota_critical?.parsed ?? this.defaultCritical,
      refquota_critical_inherit: isPropertyInherited(dataset.refquota_critical),
      quota: dataset.quota.parsed,
      quota_warning: dataset.quota_warning?.parsed ?? this.defaultWarning,
      quota_warning_inherit: isPropertyInherited(dataset.quota_warning),
      quota_critical: dataset.quota_critical?.parsed ?? this.defaultCritical,
      quota_critical_inherit: isPropertyInherited(dataset.quota_critical),
      refreservation: dataset.refreservation.parsed,
      reservation: dataset.reservation.parsed,
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
          this.slideIn.close();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
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
