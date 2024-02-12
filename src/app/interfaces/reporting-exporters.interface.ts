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
  type: string;
  enabled: boolean;
  attributes: Record<string, unknown>;
}

export type CreateReportingExporter = Omit<ReportingExporter, 'id'>;
export type UpdateReportingExporter = Omit<ReportingExporter, 'id' | 'type'>;
