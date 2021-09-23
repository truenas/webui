import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from '../entity-form/models/field-config.interface';

export interface DialogFormConfiguration<P = any> {
  title: string;
  fieldConfig: FieldConfig<P>[];
  method_rest?: string;
  method_ws?: ApiMethod;
  saveButtonText?: string;
  cancelButtonText?: string;
  custActions?: DialogFormCustomAction[];
  customSubmit?: (entityDialog: EntityDialogComponent<P>) => void;
  isCustActionVisible?: (actionId: string) => boolean;
  hideButton?: boolean;
  message?: string;
  warning?: string;
  preInit?: (entityDialog: EntityDialogComponent<P>) => void;
  afterInit?: (entityDialog: EntityDialogComponent<P>) => void;
  /**
   * @deprecated Capture parent with an arrow function instead
   */
  parent?: P;
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
