import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from '../entity-form/models/field-config.interface';

export interface DialogFormConfiguration {
  title: string;
  fieldConfig: FieldConfig[];
  method_rest?: string;
  method_ws?: ApiMethod;
  saveButtonText?: string;
  cancelButtonText?: string;
  custActions?: DialogFormCustomAction[];
  customSubmit?: (entityDialog: EntityDialogComponent) => void;
  isCustActionVisible?: (actionId: string) => boolean;
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
