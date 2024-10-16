import {
  AppMetadata, ChartFormValue, ChartSchemaGroup, ChartSchemaNode,
} from 'app/interfaces/app.interface';
import { AppMaintainer } from 'app/interfaces/available-app.interface';

export interface CatalogConfig {
  id: string;
  label: string;
  location: string;
  preferred_trains: string[];
}

export interface CatalogUpdate {
  preferred_trains: string[];
  nvidia?: boolean;
}

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

export interface GetItemDetailsParams {
  cache?: boolean;
  catalog?: string;
  train?: string;
}
