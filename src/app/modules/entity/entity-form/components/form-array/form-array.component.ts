import { Component } from '@angular/core';
import { FormArrayConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-array',
  templateUrl: './form-array.component.html',
  styleUrls: ['./form-array.component.scss'],
})
export class FormArrayComponent implements Field {
  config: FormArrayConfig;
  group: any; // TODO: Probably incorrect access in template
  fieldShow: string;
}
