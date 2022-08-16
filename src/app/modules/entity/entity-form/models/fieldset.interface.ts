import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

export interface FieldSet<P = unknown> {
  name: string;
  label?: boolean;
  class?: string;
  width?: string;
  divider?: boolean;
  maxWidth?: boolean;
  config?: FieldConfig<P>[];
  colspan?: number;
}
