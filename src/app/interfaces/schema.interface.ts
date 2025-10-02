import { SchemaType } from 'app/enums/schema.enum';

export type Schema = {
  properties: Record<string, SchemaProperties>;
} & OldSchema;

/**
 * Legacy schema interface for backward compatibility.
 * Used by reporting.exporters.exporter_schemas and DNS authenticators.
 */
export interface OldSchema {
  title: string;
  type: SchemaType | SchemaType[];
  _name_: string;
  _required_: boolean;
  const?: string;
}

export interface SchemaProperties {
  title: string;
  description?: string;
  type: SchemaType | SchemaType[];
  _name_: string;
  _required_: boolean;
  const?: string;
}
