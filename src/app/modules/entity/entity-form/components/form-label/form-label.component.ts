import {
  Component,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FormLabelConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-label.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormLabelComponent implements Field {
  config: FormLabelConfig<unknown>;
  group: UntypedFormGroup;
  fieldShow: string;
}
