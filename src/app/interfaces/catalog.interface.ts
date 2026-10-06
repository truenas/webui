import { CallResponse } from '@truenas/api-client';
import {
  AppMetadata, ChartFormValue, ChartSchemaGroup, ChartSchemaNode,
} from 'app/interfaces/app.interface';
import { AppMaintainer } from 'app/interfaces/available-app.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type CatalogConfig = CallResponse<WebUiApiDirectory, 'catalog.config'>;

export interface CatalogApp {
  app_readme: string;
  app_metadata: AppMetadata;
  categories: string[];
  healthy: boolean;
  healthy_error: string;
  icon_url: string;
  location: string;
  name: string;
  title: string;
  latest_version: string;
  latest_app_version: string;
  latest_human_version: string;
  versions?: Record<string, CatalogAppVersion>;
  recommended?: boolean;
  last_update?: string;
  catalog?: {
    id?: string;
    label?: string;
    train: string;
  };
  schema?: {
    groups: ChartSchemaGroup[];
    questions: ChartSchemaNode[];
    portals: Record<string, {
      host: string[];
      ports: string[];
      protocols: string[];
    }>;
  };
}

/**
 * Reads a `catalog.get_app_details` response into the shape the app wizard is written against. It
 * describes the same object, but the generated model leaves `versions` as an open map and carries
 * `app_metadata` only through its `{ [k: string]: unknown }`, so the two types do not overlap and
 * the conversion goes through `unknown`.
 */
export function toCatalogApp(app: CallResponse<WebUiApiDirectory, 'catalog.get_app_details'>): CatalogApp {
  return app as unknown as CatalogApp;
}

export interface CatalogAppVersion {
  app_readme: string;
  changelog: string;
  metadata: ChartMetadata;
  detailed_readme: string;
  healthy: boolean;
  healthy_error: string;
  human_version: string;
  location: string;
  required_features: string[];
  schema: {
    groups: ChartSchemaGroup[];
    questions: ChartSchemaNode[];
    portals: Record<string, {
      host: string[];
      ports: string[];
      protocols: string[];
    }>;
  };
  supported: boolean;
  values: Record<string, ChartFormValue>;
  version: string;
  train?: string;
  app?: string;
}

export interface ChartMetadata {
  apiVersion: string;
  appVersion?: string;
  app_version: string;
  dependencies: ChartMetadataDependency[];
  latest_chart_version: string;
  description: string;
  home: string;
  icon: string;
  keywords: string[];
  name: string;
  sources: string[];
  maintainers: AppMaintainer[];
  annotations: { title: string };
  version: string;
  kubeVersion: string;
  type: string;
}

export interface ChartMetadataDependency {
  name: string;
  repository: string;
  version: string;
  enabled: boolean;
}
