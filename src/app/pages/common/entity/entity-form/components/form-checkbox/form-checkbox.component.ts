import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';

@Component({
  selector: 'form-checkbox',
  styleUrls: ['form-checkbox.component.scss', '../dynamic-field/dynamic-field.css'],
  templateUrl: './form-checkbox.component.html'
})
export class FormCheckboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
