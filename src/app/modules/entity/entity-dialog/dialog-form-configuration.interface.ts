import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

export interface DialogFormConfiguration {
  title: string;
  fieldConfig: FieldConfig[];
  method_rest?: string;
  method_ws?: ApiMethod;
  saveButtonText?: string;
  cancelButtonText?: string;
  customActions?: DialogFormCustomAction[];
  customSubmit?: (entityDialog: EntityDialogComponent) => void;
  isCustomActionVisible?: (actionId: string) => boolean;
  hideButton?: boolean;
  message?: string;
  warning?: string;
  preInit?: (entityDialog: EntityDialogComponent) => void;
  afterInit?: (entityDialog: EntityDialogComponent) => void;
  confirmCheckbox?: boolean;
  hideCancel?: boolean;
  confirmInstructions?: boolean;
  name?: string;
}

export interface DialogFormCustomAction {
  id: string;
  function: () => void;
  name: string;
}
