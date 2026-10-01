import { CallParams } from '@truenas/api-client';
import { Schema } from 'app/interfaces/schema.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

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

/** Middleware types `attributes` per exporter kind; Graphite is the only one so far. */
export type ReportingExporter = WebUiQueryEntity<'reporting.exporters.query'>;

export type ReportingExporterCreate = CallParams<D, 'reporting.exporters.create'>[0];
