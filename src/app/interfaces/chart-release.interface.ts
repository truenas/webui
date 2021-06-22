import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartMetadata } from 'app/interfaces/catalog.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';

// TODO: Conflicts with ChartMetadata (lowercase d).
export interface ChartMetaData {
  name: string;
  version: string;
  latest_chart_version: string;
}

export interface UsedPort {
  port: number;
  protocol: string;
}

export interface PodStatus {
  available: number;
  desired: number;
}

export interface ChartResources {
  storage_class: { [key: string]: string };
  persistent_volumes: any[];
  host_path_volumes: any[];
  container_images: {
    [key: string]: ChartContainerImage;
  };
  truenas_certificates: number[];
  truenas_certificate_authorities: number[];
  cronjobs: any[];
  deployments: any[];
  jobs: any[];
  persistent_volume_claims: any[];
  pods: any[];
  statefulsets: any[];
}

export interface ChartReleaseCreate {
  values: { [key: string]: string };
  catalog: string;
  item: string;
  release_name: string;
  train: string;
  version: string;
}

export interface ChartReleaseCreateResponse {
  name: string;
  info: { [key: string]: string };
  config: { [key: string]: string };
  hooks: any[];
  version: number;
  namespace: string;
  chart_metadata: ChartMetaData;
  id: string;
  catalog: string;
  catalog_train: string;
  path: string;
  dataset: string;
  status: string;
  used_ports: UsedPort[];
  pod_status: PodStatus;
  update_available: boolean;
  human_version: string;
  human_latest_version: string;
  container_images_update_available: boolean;
  portals: { [key: string]: string };
  chart_schema: { [key: string]: string };
  history: { [key: string]: string };
  resources: ChartResources;
}

// TODO: May be the same as ChartReleaseCreateResponse
export interface ChartRelease {
  catalog: string;
  catalog_train: string;
  chart_metadata: ChartMetadata;
  config: { [key: string]: any };
  container_images_update_available: boolean;
  dataset: string;
  human_latest_version: string;
  human_version: string;
  id: string;
  info: {
    deleted: string;
    description: string;
    first_deployed: string;
    last_deployed: string;
    notes: string;
    status: string;
  };
  name: string;
  namespace: string;
  path: string;
  pod_status: {
    desired: number;
    available: number;
  };
  portals: {
    [name: string]: string[];
  };
  status: ChartReleaseStatus;
  update_available: boolean;
  used_ports: {
    port: number;
    protocol: string;
  }[];
  version: number;

  // Only when retrieve_resources is true.
  resources?: ChartResources;

  // Only when include_chart_schema is true.
  chart_schema?: ChartSchema;

  // Only when history is true.
  history?: { [key: string]: string };
}

export type ChartReleaseQueryParams = QueryParams<ChartRelease, {
  extra?: {
    retrieve_resources?: boolean;
    include_chart_schema?: boolean;
    history?: boolean;
  };
}>;

export interface ChartContainerImage {
  id: string;
  update_available: boolean;
}

export interface ChartSchema {
  app_readme: string;
  changelog: string;
  chart_metadata: ChartMetadata;
  detailed_readme: string;
  human_version: string;
  location: string;
  required_features: string[];
  schema: any;
  supported: boolean;
  values: any;
}
