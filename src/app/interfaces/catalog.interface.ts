import { JobState } from 'app/enums/job-state.enum';
import { AppMaintainer } from 'app/interfaces/available-app.interface';
import {
  AppMetadata, ChartFormValue, ChartSchemaGroup, ChartSchemaNode,
} from 'app/interfaces/chart-release.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';

export interface Catalog {
  branch: string;
  builtin: boolean;
  healthy: boolean;
  id: string;
  label: string;

  /**
   * E.g. "/mnt/pool/ix-applications/catalogs/github_com_truenas_charts_git_master"
   */
  location: string;
  preferred_trains: string[];

  /**
   * E.g. https://github.com/truenas/charts.git
   */
  repository: string;
  trains: Record<string, CatalogTrain>;
  error: boolean;
  cached: boolean;
  caching_job: {
    id: number;
    abortable: boolean;
    method: string;
    progress: {
      percent: number;
      description: string;
    };
    state: JobState;
  };
}

export type CatalogQueryParams = QueryParams<Catalog, {
  extra: {
    item_details?: boolean;
    cache?: boolean;
    include_chart_schema?: boolean;
  };
}>;

export interface CatalogUpdate {
  preferred_trains: string[];
}

export interface CatalogCreate {
  label: string;
  repository: string;
  branch: string;
  preferred_trains: string[];
  force: boolean;
}

export type CatalogTrain = Record<string, CatalogApp>;

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
  chart_metadata: ChartMetadata;
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
  appVersion: string;
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

export type CatalogItems = Record<string, CatalogTrain>;

export interface CatalogItemsQueryParams {
  cache?: boolean;
  cache_only?: boolean;
  retrieve_all_trains?: boolean;
  retrieve_versions?: boolean;
  trains?: string[];
}

export interface GetItemDetailsParams {
  cache?: boolean;
  catalog?: string;
  train?: string;
}
