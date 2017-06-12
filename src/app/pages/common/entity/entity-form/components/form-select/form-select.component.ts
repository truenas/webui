import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';

@Component({
  selector: 'form-select',
  styleUrls: ['form-select.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-select.component.html',
})
export class FormSelectComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
