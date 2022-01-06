import {
  Component,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormLabelConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-label',
  templateUrl: './form-label.component.html',
  styleUrls: ['../dynamic-field/dynamic-field.scss'],
})
export class FormLabelComponent implements Field {
  config: FormLabelConfig<unknown>;
  group: FormGroup;
  fieldShow: string;
}
