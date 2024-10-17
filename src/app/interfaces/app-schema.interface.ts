import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChartFormValue, ChartSchemaNode, ChartSchemaNodeConf } from 'app/interfaces/app.interface';
import { AddListItemEvent, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { CustomUntypedFormGroup } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/classes/custom-untyped-form-group';

export interface FormControlPayload {
  chartSchemaNode: ChartSchemaNode;
  formGroup: CustomUntypedFormGroup | FormGroup;
  config: HierarchicalObjectMap<ChartFormValue>;
  isNew: boolean;
  isParentImmutable: boolean;
  path?: string;
}

export interface FormListItemPayload {
  event: AddListItemEvent;
  isNew: boolean;
  isParentImmutable: boolean;
  config?: HierarchicalObjectMap<ChartFormValue>;
}

export interface CommonSchemaTransform {
  schema: ChartSchemaNodeConf;
  chartSchemaNode: ChartSchemaNode;
  isNew: boolean;
  isParentImmutable: boolean;
  newSchema: DynamicFormSchemaNode[];
}

export interface CommonSchemaAddControl {
  schema: ChartSchemaNodeConf;
  isNew: boolean;
  subscription: Subscription;
  formGroup: CustomUntypedFormGroup | FormGroup;
  config: HierarchicalObjectMap<ChartFormValue>;
  isParentImmutable: boolean;
  chartSchemaNode: ChartSchemaNode;
  path?: string;
}

export interface CommonSchemaBase {
  controlName: string;
  title: string;
  required: boolean;
  editable: boolean;
  tooltip: string;
}

export interface KeysRestoredFromFormGroup {
  newConfig: HierarchicalObjectMap<ChartFormValue>;
  keyConfig: string;
  valueConfig: ChartFormValue | HierarchicalObjectMap<ChartFormValue>;
  formConfig: FormGroup;
}

export type SerializeFormValue = HierarchicalObjectMap<ChartFormValue>
  | HierarchicalObjectMap<ChartFormValue>[]
  | ChartFormValue;

export type TransformNodeFunction = (
  chartSchemaNode: ChartSchemaNode,
  isNew: boolean,
  isParentImmutable: boolean
) => DynamicFormSchemaNode[];
