import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';

export interface Wizard {
  label: string;
  fieldConfig: FieldConfig[];
  fieldSets?: FieldSet[];
  skip?: boolean;
}
