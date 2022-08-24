import { UntypedFormArray } from '@angular/forms';
import { Observable } from 'rxjs';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { Option } from 'app/interfaces/option.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/tree-node-provider.interface';

export interface DynamicFormSchema {
  name: string;
  description: string;
  schema: DynamicFormSchemaNode[];
}

export type DynamicFormSchemaNode =
| DynamicFormSchemaInput
| DynamicFormSchemaSelect
| DynamicFormSchemaExplorer
| DynamicFormSchemaCheckbox
| DynamicFormSchemaIpaddr
| DynamicFormSchemaDict
| DynamicFormSchemaList;

export interface DynamicFormSchemaBase {
  controlName: string;
  dependsOn?: string[];
  title?: string;
  required?: boolean;
  hidden?: boolean;
  editable?: boolean;
  indent?: boolean;
}

export interface DynamicFormSchemaInput extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Input;
  tooltip?: string;
  inputType?: 'password' | 'number';
  placeholder?: string;
}

export interface DynamicFormSchemaSelect extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Select;
  tooltip?: string;
  options?: Observable<Option[]>;
  hideEmpty?: boolean;
}

export interface DynamicFormSchemaExplorer extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Explorer;
  tooltip?: string;
  nodeProvider?: TreeNodeProvider;
}

export interface DynamicFormSchemaCheckbox extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Checkbox;
  tooltip?: string;
}

export interface DynamicFormSchemaIpaddr extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Ipaddr;
  tooltip?: string;
}

export interface DynamicFormSchemaList extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.List;
  items?: DynamicFormSchemaNode[];
  itemsSchema?: unknown[];
}

export interface DynamicFormSchemaDict extends DynamicFormSchemaBase {
  type: DynamicFormSchemaType.Dict;
  attrs?: DynamicFormSchemaNode[];
}

export interface AddListItemEvent {
  array: UntypedFormArray;
  schema: unknown[];
}

export interface DeleteListItemEvent {
  array: UntypedFormArray;
  index: number;
}
