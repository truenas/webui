import { Component, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Field } from '../../models/field.interface';
import { FieldConfig } from '../../models/field-config.interface';

@Component({
  selector: 'form-input',
  styleUrls: ['form-password.component.scss'],
  templateUrl: './form-password.component.html',
})
export class FormPasswordComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
}
