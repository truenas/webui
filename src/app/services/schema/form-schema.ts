import { of } from 'rxjs';
import { DynamicFormSchemaType } from 'app/enums/dynamic-form-schema-type.enum';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';
import { DynamicFormSchemaNode } from 'app/interfaces/dynamic-form-schema.interface';

// TODO: Try replacing DynamicFormSchemaNode with classes and base parent class instead of this.
export class FormSchema {
  static schemaOfType(schemaNode: ChartSchemaNode, type: DynamicFormSchemaType): DynamicFormSchemaNode {
    return {
      type,
      controlName: schemaNode.variable,
      title: schemaNode.label,
      required: schemaNode.schema.required,
      tooltip: schemaNode.description,
      editable: schemaNode.schema.editable,
    };
  }

  static selectFromEnum(schemaNode: ChartSchemaNode): DynamicFormSchemaNode {
    return {
      controlName: schemaNode.variable,
      type: DynamicFormSchemaType.Select,
      title: schemaNode.label,
      options: of(schemaNode.schema.enum.map((option) => ({
        value: option.value,
        label: option.description,
      }))),
      required: schemaNode.schema.required,
      hideEmpty: true,
      editable: schemaNode.schema.editable,
      tooltip: schemaNode.description,
    };
  }
}
