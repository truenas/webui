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

export interface ChartRelease {
  name: string;
  info: ChartInfo;
  config: { [key: string]: any };
  hooks: any[];
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
  variable: string;
  attrs?: ChartSchemaNode[];
  items?: ChartSchemaNode[];
  default?: any;
  enum?: ChartSchemaEnum[];
  required?: boolean;
  value?: string;
  max_length?: number;
  min_length?: number;
  min?: number;
  max?: number;
  cidr?: string;
  private?: boolean;
  hidden?: boolean;
  show_if?: [/* field name */ string, /* operator name */ string, /* operator value */ string][];
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
