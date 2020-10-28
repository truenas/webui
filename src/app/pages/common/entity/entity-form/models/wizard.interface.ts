import { FieldConfig} from './field-config.interface';
import { FieldSet} from './fieldset.interface';

export interface Wizard {
  label:string;
  fieldConfig:FieldConfig[];
  fieldSets?: FieldSet[];
  skip?: boolean;
}
