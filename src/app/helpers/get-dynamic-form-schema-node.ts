import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { SchemaType } from 'app/enums/schema.enum';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';
import { DynamicFormSchemaCheckbox, DynamicFormSchemaInput, DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';
import { Schema, SchemaProperties } from 'app/interfaces/schema.interface';

export function getDynamicFormSchemaNode(schema: SchemaProperties | Schema): DynamicFormSchemaNode {
  const baseSchema = {
    controlName: schema._name_,
    type: DynamicFormSchemaType.Input,
    title: toHumanReadableKey(schema.title),
    required: schema._required_,
  } as DynamicFormSchemaInput;

  if (schema.type === SchemaType.Boolean) {
    return {
      ...baseSchema,
      type: DynamicFormSchemaType.Checkbox,
    } as DynamicFormSchemaCheckbox;
  }

  if (schema.type === SchemaType.Integer) {
    return {
      ...baseSchema,
      inputType: 'number',
    };
  }

  return baseSchema;
}
