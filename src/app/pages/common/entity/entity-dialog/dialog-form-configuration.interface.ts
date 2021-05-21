import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from '../entity-form/models/field-config.interface';

export interface DialogFormConfiguration<P = any> {
  title: string;
  fieldConfig: FieldConfig[];
  method_rest?: string;
  method_ws?: ApiMethod;
  saveButtonText?: string;
  cancelButtonText?: string;
  custActions?: any[];
  customSubmit?: (entityDialog: EntityDialogComponent<P>) => void;
  isCustActionVisible?: any;
  hideButton?: boolean;
  message?: any;
  warning?: any;
  preInit?: any;
  afterInit?: any;
  parent?: P;
  confirmCheckbox?: boolean;
  hideCancel?: boolean;
  confirmInstructions?: boolean;
}
