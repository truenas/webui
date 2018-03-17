import { FieldConfig} from './field-config.interface';

export interface FieldSet {
  name:string;
  class?:string;
  width?:string;
  config?:FieldConfig[];
}
