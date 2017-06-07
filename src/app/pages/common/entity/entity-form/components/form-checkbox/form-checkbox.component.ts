import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';

@Component({
  selector: 'form-checkbox',
  styleUrls: ['form-checkbox.component.scss'],
  template: `
    <div 
      class="dynamic-field form-checkbox" 
      [formGroup]="group">
      <label>{{ config.label }}</label>
      <input
        type="checkbox"
        [formControlName]="config.name">
    </div>
  `
})
export class FormCheckboxComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
}
