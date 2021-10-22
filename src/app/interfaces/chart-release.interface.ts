import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartMetadata } from 'app/interfaces/catalog.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';

export interface UsedPort {
  port: number;
  protocol: string;
}

export interface PodStatus {
  available: number;
  desired: number;
}

export interface ChartInfo {
  deleted: string;
  description: string;
  first_deployed: string;
  last_deployed: string;
  notes: string;
  status: string;
}

export interface ChartResources {
  storage_class: { [key: string]: string };
  persistent_volumes: unknown[];
  host_path_volumes: unknown[];
  container_images: {
    [key: string]: ChartContainerImage;
  };
  truenas_certificates: number[];
  truenas_certificate_authorities: number[];
  cronjobs: unknown[];
  deployments: unknown[];
  jobs: unknown[];
  persistent_volume_claims: unknown[];
  pods: unknown[];
  statefulsets: unknown[];
}

export interface ChartReleaseCreate {
  values: { [key: string]: string };
  catalog: string;
  item: string;
  release_name: string;
  train: string;
  version: string;
}

export interface ChartRelease {
  name: string;
  info: ChartInfo;
  config: { [key: string]: any };
  hooks: unknown[];
  version: number;
  namespace: string;
  chart_metadata: ChartMetadata;
  id: string;
  catalog: string;
  catalog_train: string;
  path: string;
  dataset: string;
  status: ChartReleaseStatus;
  used_ports: UsedPort[];
  pod_status: PodStatus;
  update_available: boolean;
  human_version: string;
  human_latest_version: string;
  container_images_update_available: boolean;
  portals: { [name: string]: string[] };
  chart_schema: ChartSchema;
  history: { [key: string]: string };
  resources?: ChartResources;

  // TODO: Frontend field, move to another interface.
  selected?: boolean;
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

export interface ChartSchemaEnum {
  value: string;
  description: string;
}

export interface ChartSchemaNodeConf {
  type: string;
  attrs?: ChartSchemaNode[];
  items?: ChartSchemaNode[];
  default?: boolean;
  enum?: ChartSchemaEnum[];
  required?: boolean;
  value?: string;
  max_length?: number;
  min_length?: number;
  min?: number;
  max?: number;
  cidr?: boolean;
  private?: boolean;
  hidden?: boolean;
  show_if?: string[][];
  show_subquestions_if?: any;
  editable?: boolean;
  subquestions?: ChartSchemaNode[];
}

export interface ChartSchemaGroup {
  name: string;
  description: string;
}

export interface ChartSchemaNode {
  group?: string;
  label: string;
  schema: ChartSchemaNodeConf;
  variable: string;
  description?: string;
}

export interface ChartSchema {
  app_readme: string;
  changelog: string;
  chart_metadata: ChartMetadata;
  detailed_readme: string;
  human_version: string;
  location: string;
  required_features: string[];
  schema: {
    groups: ChartSchemaGroup[];
    questions: ChartSchemaNode[];
    portals: {
      web_portal: {
        host: string[];
        ports: string[];
        protocols: string[];
      };
    };
  };
  supported: boolean;
  values: any;
}
