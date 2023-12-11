import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DatasetCaseSensitivity, DatasetPreset, datasetPresetLabels } from 'app/enums/dataset.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import {
  forbiddenValues,
} from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { NameValidationService } from 'app/services/name-validation.service';

@UntilDestroy()
@Component({
  selector: 'ix-name-and-options',
  templateUrl: './name-and-options-section.component.html',
  styleUrls: ['./name-and-options-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameAndOptionsSectionComponent implements OnInit, OnChanges {
  @Input() existing: Dataset;
  @Input() parent: Dataset;

  datasetPresetOptions$ = of(mapToOptions(datasetPresetLabels, this.translate));

  readonly form = this.formBuilder.group({
    parent: [''],
    name: ['', [
      Validators.required,
      Validators.pattern(this.nameValidationService.nameRegex),
    ]],
    share_type: [DatasetPreset.Generic],
  });

  readonly datasetPresetForm = this.formBuilder.group({
    create_smb: [true],
    create_nfs: [true],
    smb_name: [''],
  });

  readonly helptext = helptext;
  readonly DatasetPreset = DatasetPreset;

  get isCreatingSmb(): boolean {
    return this.form.value.share_type === DatasetPreset.Smb
      || this.form.value.share_type === DatasetPreset.Multiprotocol;
  }

  get isCreatingNfs(): boolean {
    return this.form.value.share_type === DatasetPreset.Multiprotocol;
  }

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private nameValidationService: NameValidationService,
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

    this.form.controls.name.valueChanges.pipe(untilDestroyed(this)).subscribe((name) => {
      this.datasetPresetForm.patchValue({
        smb_name: name,
      });
    });
  }

  getPayload(): Partial<DatasetCreate> | Partial<DatasetUpdate> {
    const payload = this.form.value;

    if (this.existing) {
      delete payload.share_type;
      return payload;
    }

    return {
      ...payload,
      name: `${this.parent.name}/${payload.name}`,
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
}
