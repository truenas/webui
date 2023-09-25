import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { DatasetCaseSensitivity, DatasetSync, datasetSyncLabels } from 'app/enums/dataset.enum';
import { OnOff, onOffLabels } from 'app/enums/on-off.enum';
import { inherit, WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, DatasetCreate, DatasetUpdate } from 'app/interfaces/dataset.interface';
import { Option } from 'app/interfaces/option.interface';
import {
  forbiddenValues,
} from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { DatasetFormService } from 'app/pages/datasets/components/dataset-form/utils/dataset-form.service';
import { datasetNameTooLong } from 'app/pages/datasets/components/dataset-form/utils/name-length-validation';
import { getFieldValue } from 'app/pages/datasets/components/dataset-form/utils/zfs-property.utils';
import { NameValidationService } from 'app/services/name-validation.service';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-name-and-options',
  templateUrl: './name-and-options-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameAndOptionsSectionComponent implements OnInit, OnChanges {
  @Input() existing: Dataset;
  @Input() parent: Dataset;

  readonly form = this.formBuilder.group({
    parent: [''],
    name: ['', [
      Validators.required,
      Validators.pattern(this.nameValidationService.nameRegex),
    ]],
    comments: [''],
    sync: [inherit as WithInherit<DatasetSync>],
    compression: [inherit as WithInherit<string>],
    atime: [inherit as WithInherit<OnOff>],
  });

  syncOptions$: Observable<Option[]>;
  compressionOptions$: Observable<Option[]>;
  atimeOptions$: Observable<Option[]>;

  readonly helptext = helptext;

  private readonly defaultSyncOptions$ = of(mapToOptions(datasetSyncLabels, this.translate));
  private readonly defaultCompressionOptions$ = this.ws.call('pool.dataset.compression_choices').pipe(choicesToOptions());
  private readonly defaultAtimeOptions$ = of(mapToOptions(onOffLabels, this.translate));

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private nameValidationService: NameValidationService,
    private datasetFormService: DatasetFormService,
  ) {}

  ngOnChanges(): void {
    if (this.parent) {
      this.form.controls.parent.setValue(this.parent.name);
      this.addNameValidators();
    }

    this.setSelectOptions();
    this.setFormValues();
    this.setNameDisabledStatus();
  }

  ngOnInit(): void {
    this.form.controls.parent.disable();
  }

  getPayload(): Partial<DatasetCreate> | Partial<DatasetUpdate> {
    const commonFields = _.pick(this.form.value, ['comments', 'sync', 'compression', 'atime']);
    if (this.existing) {
      return commonFields;
    }

    return {
      ...commonFields,
      name: `${this.parent.name}/${this.form.value.name}`,
    } as Partial<DatasetCreate>;
  }

  private setFormValues(): void {
    if (!this.existing) {
      return;
    }

    this.form.patchValue({
      name: this.existing.name,
      comments: this.existing.comments?.source === ZfsPropertySource.Local
        ? this.existing.comments.value
        : '',
      sync: getFieldValue(this.existing.sync, this.parent),
      compression: getFieldValue(this.existing.compression, this.parent),
      atime: getFieldValue(this.existing.atime, this.parent),
    });
  }

  private setSelectOptions(): void {
    if (!this.parent) {
      this.syncOptions$ = this.defaultSyncOptions$;
      this.compressionOptions$ = this.defaultCompressionOptions$;
      this.atimeOptions$ = this.defaultAtimeOptions$;
      return;
    }

    this.syncOptions$ = this.defaultSyncOptions$.pipe(
      this.datasetFormService.addInheritOption(this.parent.sync.value),
    );
    this.compressionOptions$ = this.defaultCompressionOptions$.pipe(
      this.datasetFormService.addInheritOption(this.parent.compression.value),
    );
    this.atimeOptions$ = this.defaultAtimeOptions$.pipe(
      this.datasetFormService.addInheritOption(this.parent.atime.value),
    );
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
