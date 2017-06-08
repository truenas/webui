import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';

@Component({
  selector: 'form-textarea',
  styleUrls: ['form-textarea.component.scss'],
  template: `
    <div 
      class="dynamic-field form-textarea" 
      [formGroup]="group">
      <label>{{ config.label }}</label>
      <textarea
        [attr.placeholder]="config.placeholder"
        [formControlName]="config.name">
        {{ config.value }}
      </textarea>
    </div>
  `
})
export class FormTextareaComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
}
