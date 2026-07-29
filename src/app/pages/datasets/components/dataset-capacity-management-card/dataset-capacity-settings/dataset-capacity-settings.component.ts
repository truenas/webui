import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import { GiB } from 'app/constants/bytes.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { DatasetDetails, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { getUserProperty, isPropertyInherited, isRootDataset } from 'app/pages/datasets/utils/dataset.utils';

@Component({
  selector: 'ix-dataset-capacity-settings',
  templateUrl: './dataset-capacity-settings.component.html',
  styleUrls: ['./dataset-capacity-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    RequiresRolesDirective,
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    TnButtonComponent,
  ],
})
export class DatasetCapacitySettingsComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbarService = inject(SnackbarService);
  private translate = inject(TranslateService);
  private validators = inject(IxValidatorsService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];
  protected readonly InputType = InputType;

  readonly isLoading = signal(false);
  readonly defaultQuotaWarning = 80;
  readonly defaultQuotaCritical = 95;

  /**
   * Dataset to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Unused in the legacy SlideIn host (which supplies it via `slideInRef.getData()`).
   */
  readonly datasetToEdit = input<DatasetDetails | undefined>(undefined);

  form = this.formBuilder.group({
    refquota: [null as number | null, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptextDatasetForm.quotaTooSmall),
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

    quota: [null as number | null, this.validators.withMessage(
      Validators.min(GiB),
      this.translate.instant(helptextDatasetForm.quotaTooSmall),
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

    refreservation: [null as number | null],
    reservation: [null as number | null],
  });

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  protected dataset: DatasetDetails | undefined;

  readonly helptext = helptextDatasetForm;

  private oldValues: DatasetCapacitySettingsComponent['form']['value'];
  private readonly inheritRelations = {
    refquota_warning_inherit: 'refquota_warning',
    refquota_critical_inherit: 'refquota_critical',
    quota_warning_inherit: 'quota_warning',
    quota_critical_inherit: 'quota_critical',
  } as const;

  constructor() {
    super();
    this.setFormRelations();
  }

  ngOnInit(): void {
    this.dataset = this.slideInRef
      ? this.slideInRef.getData() as DatasetDetails | undefined
      : this.datasetToEdit();
    if (this.dataset) {
      this.setDatasetForEdit(this.dataset);
    }
  }

  private setFormRelations(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
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
    return !!this.dataset && isRootDataset(this.dataset);
  }

  private setDatasetForEdit(dataset: DatasetDetails): void {
    const refquotaWarning = getUserProperty<number>(dataset, 'refquota_warning');
    const refquotaCritical = getUserProperty<number>(dataset, 'refquota_critical');
    const quotaWarning = getUserProperty<number>(dataset, 'quota_warning');
    const quotaCritical = getUserProperty<number>(dataset, 'quota_critical');

    this.oldValues = {
      refquota: dataset.refquota.parsed,
      refquota_warning: refquotaWarning?.parsed ?? this.defaultQuotaWarning,
      refquota_warning_inherit: isPropertyInherited(refquotaWarning),
      refquota_critical: refquotaCritical?.parsed ?? this.defaultQuotaCritical,
      refquota_critical_inherit: isPropertyInherited(refquotaCritical),
      quota: dataset.quota.parsed,
      quota_warning: quotaWarning?.parsed ?? this.defaultQuotaWarning,
      quota_warning_inherit: isPropertyInherited(quotaWarning),
      quota_critical: quotaCritical?.parsed ?? this.defaultQuotaCritical,
      quota_critical_inherit: isPropertyInherited(quotaCritical),
      refreservation: dataset.refreservation.parsed,
      reservation: dataset.reservation.parsed,
    };
    this.form.patchValue(this.oldValues);
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const payload = this.getChangedFormValues();

    this.api.call('pool.dataset.update', [this.dataset.id, payload])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.snackbarService.success(
            this.translate.instant('Dataset settings updated.'),
          );
          this.close(true);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
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
