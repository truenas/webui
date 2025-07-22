import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { SchemaType } from 'app/enums/schema.enum';
import { SchemaProperties } from 'app/interfaces/schema.interface';
import { getDynamicFormSchemaNode } from './get-dynamic-form-schema-node';

jest.mock('app/helpers/object-keys-to-human-readable.helper', () => ({
  toHumanReadableKey: jest.fn((value: string) => value),
}));

describe('getDynamicFormSchemaNode', () => {
  const base: SchemaProperties = {
    _name_: 'test',
    title: 'Title',
    _required_: true,
    type: SchemaType.String,
  };

  it('creates checkbox node for boolean schema', () => {
    const schema: SchemaProperties = { ...base, type: SchemaType.Boolean };
    expect(getDynamicFormSchemaNode(schema)).toEqual({
      controlName: 'test',
      type: DynamicFormSchemaType.Checkbox,
      title: 'Title',
      required: true,
    });
  });

  it('creates number input for integer schema', () => {
    const schema: SchemaProperties = { ...base, type: SchemaType.Integer };
    expect(getDynamicFormSchemaNode(schema)).toEqual({
      controlName: 'test',
      type: DynamicFormSchemaType.Input,
      title: 'Title',
      required: true,
      inputType: 'number',
    });
  });

  it('creates base input for other types', () => {
    const schema: SchemaProperties = { ...base, type: SchemaType.String };
    expect(getDynamicFormSchemaNode(schema)).toEqual({
      controlName: 'test',
      type: DynamicFormSchemaType.Input,
      title: 'Title',
      required: true,
    });
  });
});
