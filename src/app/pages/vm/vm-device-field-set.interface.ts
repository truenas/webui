import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';

export interface VmDeviceFieldSet extends FieldSet {
  fieldConfig?: FieldConfig[];
  cdromFieldConfig?: FieldConfig[];
  diskFieldConfig?: FieldConfig[];
  nicFieldConfig?: FieldConfig[];
  rawfileFieldConfig?: FieldConfig[];
  pciFieldConfig?: FieldConfig[];
  displayFieldConfig?: FieldConfig[];
}
