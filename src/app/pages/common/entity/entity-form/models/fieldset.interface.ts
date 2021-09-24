import { FieldConfig } from './field-config.interface';

export interface FieldSet<P = any> {
  name: string;
  label?: boolean;
  class?: string;
  width?: string;
  divider?: boolean;
  maxWidth?: boolean;
  config?: FieldConfig<P>[];
  colspan?: number;
}
