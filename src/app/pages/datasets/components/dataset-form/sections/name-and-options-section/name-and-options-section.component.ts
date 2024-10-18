import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
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
  standalone: true,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxTextareaComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class NameAndOptionsSectionComponent implements OnInit, OnChanges {
  @Input() existing: Dataset;
  @Input() parent: Dataset;

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

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private smbValidationService: SmbValidationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    if (this.parent) {
      this.form.controls.parent.setValue(this.parent.name);
      this.addNameValidators();
    }

    this.setFormValues();
    this.setNameDisabledStatus();
  }

  ngOnInit(): void {
    this.form.controls.parent.disable();

    this.listenForSmbNameValidation();

    merge(this.form.statusChanges, this.datasetPresetForm.statusChanges)
      .pipe(untilDestroyed(this))
      .subscribe((status) => this.formValidityChange.emit(status === 'VALID'));
  }

  getPayload(): Partial<DatasetCreate> | Partial<DatasetUpdate> {
    const payload = this.form.value;

    if (this.existing) {
      delete payload.share_type;
      return payload;
    }

    return {
      ...payload,
      name: payload.name && this.form.controls.name.valid ? `${this.parent.name}/${payload.name}` : null,
    };
  }

  private setFormValues(): void {
    if (!this.existing) {
      return;
    }

    this.form.patchValue({
      name: this.existing.name,
    });
  }

  private setNameDisabledStatus(): void {
    if (this.existing) {
      this.form.controls.name.disable();
    } else {
      this.form.controls.name.enable();
    }
  }

  private addNameValidators(): void {
    const isNameCaseSensitive = this.parent.casesensitivity.value === DatasetCaseSensitivity.Sensitive;
    const namesInUse = this.parent.children.map((child) => {
      const childName = /[^/]*$/.exec(child.name)[0];
      if (isNameCaseSensitive) {
        return childName.toLowerCase();
      }

      return childName;
    });

    this.form.controls.name.addValidators([
      datasetNameTooLong(this.parent.name),
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
          smbNameControl.patchValue(null);
        }

        this.cdr.markForCheck();
      });
  }
}
