import { FieldConfig} from './field-config.interface';

export interface FieldSet {
  name:string;
  label?:boolean;
  class?:string;
  width?:string;
  divider?:boolean;
  config?:FieldConfig[];
}
