import { FieldConfig} from './field-config.interface';

export interface FieldSet {
  name:string;
  class?:string;
  config?:FieldConfig[];
}
