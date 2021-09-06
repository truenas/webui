import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityTaskComponent } from 'app/pages/common/entity/entity-task/entity-task.component';

export interface EntityTaskConfiguration {
  preInit?: () => void;
  preTaskName?: string;
  resource_name?: string;
  fieldConfig: FieldConfig[];
  afterInit?: (entityTask: EntityTaskComponent) => void;
  hide_fileds?: string[];
  route_success?: string[];
}
