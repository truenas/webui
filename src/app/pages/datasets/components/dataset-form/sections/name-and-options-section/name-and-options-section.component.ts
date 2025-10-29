import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnChanges, OnInit, output, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  delay, merge, of,
} from 'rxjs';
import { nameValidatorRegex } from 'app/constants/name-validator.constant';
import {
  DatasetCaseSensitivity, DatasetPreset, datasetPresetLabels,
} from 'app/enums/dataset.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextDatasetForm } from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  forbiddenValues,
} from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { SmbValidationService } from 'app/pages/sharing/smb/smb-form/smb-validator.service';

@UntilDestroy()
@Component({
  selector: 'ix-name-and-options',
  templateUrl: './name-and-options-section.component.html',
  styleUrls: ['./name-and-options-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    DetailsTableComponent,
    DetailsItemComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class NameAndOptionsSectionComponent implements OnInit, OnChanges {
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private smbValidationService = inject(SmbValidationService);
  private cdr = inject(ChangeDetectorRef);

  readonly existing = input<Dataset>();
  readonly parent = input<Dataset>();

  readonly formValidityChange = output<boolean>();

  datasetPresetOptions$ = of(mapToOptions(datasetPresetLabels, this.translate));

  readonly form = this.formBuilder.group({
    parent: [''],
    name: ['', [
      Validators.required,
      Validators.pattern(nameValidatorRegex),
    ]],
    share_type: [DatasetPreset.Generic],
  });

  readonly datasetPresetForm = this.formBuilder.group({
    create_smb: [true],
    create_nfs: [true],
    smb_name: [''],
  });

  readonly helptext = helptextDatasetForm;
  readonly DatasetPreset = DatasetPreset;

  get canCreateSmb(): boolean {
    return this.form.value.share_type === DatasetPreset.Smb
      || this.form.value.share_type === DatasetPreset.Multiprotocol;
  }

  get canCreateNfs(): boolean {
    return this.form.value.share_type === DatasetPreset.Multiprotocol;
  }

  ngOnChanges(): void {
    const parent = this.parent();
    if (parent) {
      this.form.controls.parent.setValue(parent.name);
      this.addNameValidators(parent);
    }

    this.setFormValues();
    this.setNameDisabledStatus();

    // Force validation to run after validators are added
    this.form.controls.name.updateValueAndValidity();

    // Reset touched state when inputs change (e.g., when form is opened for a new dataset)
    // Must be done AFTER updateValueAndValidity to prevent showing errors immediately
    if (!this.existing()) {
      this.form.controls.name.markAsUntouched();
      this.form.controls.name.markAsPristine();
    }

    this.emitValidity();
  }

  ngOnInit(): void {
    this.form.controls.parent.disable();

    this.listenForSmbNameValidation();

    merge(this.form.statusChanges, this.datasetPresetForm.statusChanges)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.emitValidity());

    // Ensure form starts in untouched state to prevent validation errors from showing immediately
    this.form.markAsUntouched();

    // Emit initial validity state
    this.emitValidity();
  }

  getPayload(): Partial<DatasetCreate> | Partial<DatasetUpdate> {
    const payload = this.form.value;

    if (this.existing()) {
      delete payload.share_type;
      return payload;
    }

    return {
      ...payload,
      name: payload.name ? `${this.parent()?.name}/${payload.name}` : '',
    };
  }

  private setFormValues(): void {
    const existing = this.existing();
    if (!existing) {
      return;
    }

    this.form.patchValue({
      name: existing.name,
    });
  }

  private setNameDisabledStatus(): void {
    if (this.existing()) {
      this.form.controls.name.disable();
    } else {
      this.form.controls.name.enable();
    }
  }

  private addNameValidators(parent: Dataset): void {
    const isNameCaseSensitive = parent.casesensitivity.value === DatasetCaseSensitivity.Sensitive;
    const namesInUse = (parent.children?.map((child) => {
      const childName = /[^/]*$/.exec(child.name)?.[0];
      if (isNameCaseSensitive) {
        return childName?.toLowerCase();
      }

      return childName;
    }) || []).filter((name): name is string => name !== undefined);

    this.form.controls.name.addValidators([
      datasetNameTooLong(parent.name),
      forbiddenValues(namesInUse, isNameCaseSensitive),
    ]);
  }

  private listenForSmbNameValidation(): void {
    merge(
      this.form.controls.share_type.valueChanges,
      this.datasetPresetForm.controls.create_smb.valueChanges,
    )
      .pipe(delay(0), untilDestroyed(this))
      .subscribe(() => {
        const smbNameControl = this.datasetPresetForm.controls.smb_name;

        if (this.canCreateSmb && !!this.datasetPresetForm.controls.create_smb.value) {
          smbNameControl.addValidators(Validators.required);
          smbNameControl.addAsyncValidators(this.smbValidationService.validate());
          smbNameControl.patchValue(this.form.controls.name.value);
          smbNameControl.markAsTouched();
        } else {
          smbNameControl.clearAsyncValidators();
          smbNameControl.clearValidators();
          smbNameControl.patchValue('');
        }

        // Update validity after changing validators
        smbNameControl.updateValueAndValidity();
        this.cdr.markForCheck();
      });
  }

  private emitValidity(): void {
    const isValid = this.form.valid && this.datasetPresetForm.valid;
    this.formValidityChange.emit(isValid);
  }
}
