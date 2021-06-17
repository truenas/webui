import { Component } from '@angular/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Field } from 'app/pages/common/entity/entity-form/models/field.interface';

@Component({
  selector: 'form-array',
  templateUrl: './form-array.component.html',
  styleUrls: ['./form-array.component.scss'],
})
export class FormArrayComponent implements Field {
  config: FieldConfig;
  group: any; // TODO: Probably incorrect access in template
  fieldShow: string;
}
