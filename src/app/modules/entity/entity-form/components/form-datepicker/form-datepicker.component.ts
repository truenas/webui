import { Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  templateUrl: './form-datepicker.component.html',
})
export class FormDatepickerComponent implements Field {
  config: FieldConfig;
  group: UntypedFormGroup;
  fieldShow: string;
}
