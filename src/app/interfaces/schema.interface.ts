import { SchemaType } from 'app/enums/schema.enum';

export type Schema = {
  properties: Record<string, SchemaProperties>;
} & OldSchema;

/**
 * @deprecated Remove after "reporting.exporters.exporter_schemas" refactoring.
 */
export interface OldSchema {
  title: string;
  type: SchemaType | SchemaType[];
  _name_: string;
  _required_: boolean;

}

export interface SchemaProperties {
  title: string;
  description?: string;
  type: SchemaType | SchemaType[];
  _name_: string;
  _required_: boolean;
  const?: string;
}
