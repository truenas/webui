import { FormArray } from '@angular/forms';
import { Observable } from 'rxjs';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { Option } from 'app/interfaces/option.interface';
import { TreeNodeProvider } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';

export interface DynamicFormSchema {
  name: string;
  description: string;
  schema: DynamicFormSchemaNode[];
}

export interface DynamicFormSchemaNode {
  variable: string;
  type: string;
  attrs?: DynamicFormSchemaNode[];
  items?: DynamicFormSchemaNode[];
  items_schema?: ChartSchemaNode[];
  title?: string;
  required?: boolean;
  hidden?: boolean;
  editable?: boolean;
  private?: boolean;
  options?: Observable<Option[]>;
  nodeProvider?: TreeNodeProvider;
  cidr?: boolean;
}

export interface AddListItemEmitter {
  array: FormArray;
  schema: ChartSchemaNode[];
}

export interface DeleteListItemEmitter {
  array: FormArray;
  index: number;
}
