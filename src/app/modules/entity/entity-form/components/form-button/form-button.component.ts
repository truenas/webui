import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormButtonConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-button.component.html',
})
export class FormButtonComponent implements Field {
  config: FormButtonConfig;
  group: FormGroup;
  fieldShow: string;
}
