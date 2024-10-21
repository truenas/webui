import { of } from 'rxjs';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { CommonSchemaBase, CommonSchemaTransform, TransformNodeFunction } from 'app/interfaces/app-schema.interface';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import {
  DynamicFormSchemaCheckbox,
  DynamicFormSchemaCron,
  DynamicFormSchemaDict,
  DynamicFormSchemaEnum,
  DynamicFormSchemaExplorer,
  DynamicFormSchemaInput,
  DynamicFormSchemaIpaddr,
  DynamicFormSchemaList,
  DynamicFormSchemaNode,
  DynamicFormSchemaSelect,
  DynamicFormSchemaText,
  DynamicFormSchemaUri,
} from 'app/interfaces/dynamic-form-schema.interface';
import { FilesystemService } from 'app/services/filesystem.service';

const commonSchemaTypes = [
  ChartSchemaType.Int,
  ChartSchemaType.String,
  ChartSchemaType.Boolean,
  ChartSchemaType.Path,
  ChartSchemaType.Hostpath,
  ChartSchemaType.Ipaddr,
  ChartSchemaType.Uri,
  ChartSchemaType.Text,
] as const;

export function isCommonSchemaType(type: ChartSchemaType): type is typeof commonSchemaTypes[number] {
  return (commonSchemaTypes as unknown as ChartSchemaType[]).includes(type);
}

export function buildCommonSchemaBase(payload: Partial<CommonSchemaTransform>): CommonSchemaBase {
  const { schema, chartSchemaNode } = payload;

  return {
    controlName: chartSchemaNode.variable,
    title: chartSchemaNode.label,
    required: schema.required || (!schema.empty && schema.empty !== undefined),
    editable: schema.editable,
    tooltip: chartSchemaNode.description,
  };
}

export function transformEnumSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaEnum {
  const { schema } = payload;

  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Enum,
    options: of(schema.enum.map((option) => ({
      value: option.value,
      label: option.description,
    }))),
  };
}

export function transformIntSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaInput | DynamicFormSchemaEnum | DynamicFormSchemaSelect {
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

export function transformUriSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaUri {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Uri,
    inputType: undefined,
  };
}

export function transformCronSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaCron {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Cron,
  };
}

export function transformTextSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaText {
  const inputSchema: DynamicFormSchemaText = {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Text,
    language: payload.schema.language,
  };
  return inputSchema;
}

export function transformStringSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaInput | DynamicFormSchemaEnum | DynamicFormSchemaSelect {
  const { schema } = payload;

  if (schema.enum) {
    return transformEnumSchemaType(payload);
  }

  const inputSchema: DynamicFormSchemaInput = {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Input,
    inputType: schema.private ? 'password' : undefined,
  };
  return inputSchema;
}

export function transformPathSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaInput {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Input,
  };
}

export function transformHostPathSchemaType(
  payload: CommonSchemaTransform,
  filesystemService: FilesystemService,
): DynamicFormSchemaExplorer {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Explorer,
    nodeProvider: filesystemService.getFilesystemNodeProvider(),
  };
}

export function transformBooleanSchemaType(payload: CommonSchemaTransform): DynamicFormSchemaCheckbox {
  return {
    ...buildCommonSchemaBase(payload),
    type: DynamicFormSchemaType.Checkbox,
  };
}

export function transformIpaddrSchemaType(
  payload: CommonSchemaTransform,
): DynamicFormSchemaIpaddr | DynamicFormSchemaInput {
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
): DynamicFormSchemaDict {
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
    tooltip: chartSchemaNode.description,
    editable: schema.editable,
  };
}

export function transformListSchemaType(
  payload: CommonSchemaTransform,
  transformNode: TransformNodeFunction,
): DynamicFormSchemaList {
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
    tooltip: payload.chartSchemaNode.description,
    default: isNew ? schema.default as unknown[] : [],
    dependsOn: schema.show_if?.map((conditional) => conditional[0]),
  };
}
