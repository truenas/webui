import { of } from 'rxjs';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { CommonSchemaBase, CommonSchemaTransform, TransformNodeFunction } from 'app/interfaces/app-schema.interface';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchemaInput, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { FilesystemService } from 'app/services/filesystem.service';

export function buildCommonSchemaBase(payload: Partial<CommonSchemaTransform>): CommonSchemaBase {
  const {
    schema, chartSchemaNode, isNew, isParentImmutable,
  } = payload;

  return {
    controlName: chartSchemaNode.variable,
    title: chartSchemaNode.label,
    required: schema.required,
    editable: (!isNew && (!!schema.immutable || isParentImmutable)) ? false : schema.editable,
    tooltip: chartSchemaNode.description,
  };
}

export function transformEnumSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  const { schema } = payload;

  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Select,
    options: of(schema.enum.map((option) => ({
      value: option.value,
      label: option.description,
    }))),
    hideEmpty: true,
  };
}

export function transformIntSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  const { schema } = payload;

  if (schema.enum) {
    return transformEnumSchemaType(payload);
  }
  const inputSchema: DynamicFormSchemaInput = {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Input,
    inputType: 'number',
  };
  return inputSchema;
}

export function transformStringSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  const { schema, chartSchemaNode } = payload;

  if (schema.enum) {
    return transformEnumSchemaType(payload);
  }
  const inputSchema: DynamicFormSchemaInput = {
    ...buildCommonSchemaBase({ schema, chartSchemaNode }),
    type: DynamicFormSchemaType.Input,
    inputType: schema.private ? 'password' : undefined,
  };
  return inputSchema;
}

export function transformPathSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Input,
  };
}

export function transformHostPathSchemaType(
  payload: CommonSchemaTransform,
  filesystemService: FilesystemService,
): DynamicFormSchemaNode {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Explorer,
    nodeProvider: filesystemService.getFilesystemNodeProvider(),
  };
}

export function transformBooleanSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Checkbox,
  };
}

export function transformIpaddrSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaNode {
  const { schema } = payload;

  if (schema.cidr) {
    return {
      ...buildCommonSchemaBase(payload),
      type: DynamicFormSchemaType.Ipaddr,
    };
  }
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Input,
  };
}

export function transformDictSchemaType(
  payload: CommonSchemaTransform,
  transformNode: TransformNodeFunction,
): DynamicFormSchemaNode {
  const {
    schema, isNew, isParentImmutable, chartSchemaNode,
  } = payload;

  let attrs: DynamicFormSchemaNode[] = [];
  schema.attrs.forEach((attr) => {
    attrs = attrs.concat(transformNode(attr, isNew, !!schema.immutable || isParentImmutable));
  });
  return {
    controlName: chartSchemaNode.variable,
    type: DynamicFormSchemaType.Dict,
    title: chartSchemaNode.label,
    attrs,
    editable: schema.editable,
  };
}

export function transformListSchemaType(
  payload: CommonSchemaTransform,
  transformNode: TransformNodeFunction,
): DynamicFormSchemaNode {
  const { schema, isNew, isParentImmutable } = payload;

  let items: DynamicFormSchemaNode[] = [];
  let itemsSchema: ChartSchemaNode[] = [];
  schema.items.forEach((item) => {
    if (item.schema.attrs) {
      item.schema.attrs.forEach((attr) => {
        items = items.concat(transformNode(attr, isNew, !!schema.immutable || isParentImmutable));
        itemsSchema = itemsSchema.concat(attr);
      });
    } else {
      items = items.concat(transformNode(item, isNew, !!schema.immutable || isParentImmutable));
      itemsSchema = itemsSchema.concat(item);
    }
  });
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.List,
    items,
    itemsSchema,
    dependsOn: schema.show_if?.map((conditional) => conditional[0]),
  };
}
