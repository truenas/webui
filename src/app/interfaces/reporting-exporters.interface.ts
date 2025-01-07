import { Schema } from 'app/interfaces/schema.interface';

export enum ReportingExporterKey {
  Graphite = 'GRAPHITE',
}

export interface ReportingExporterSchema {
  key: ReportingExporterKey;
  schema: Schema[];
}

export interface ReportingExporterList {
  key: ReportingExporterKey;
  variables: string[];
}

export interface ReportingExporter {
  name: string;
  id: number;
  enabled: boolean;
  attributes: Record<string, unknown>;
}

export type UpdateReportingExporter = Partial<Omit<ReportingExporter, 'id'>>;
