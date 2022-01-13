import { FormGroup } from '@angular/forms';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

export interface Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;
}
