import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';

@Component({
  selector : 'form-array',
  templateUrl : './form-array.component.html',
  styleUrls: ['./form-array.component.css'],
})
export class FormArrayComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  buildConfig(config, index) {
    return {
      ...config,
      arrayIndex: index
    }
  }
}
