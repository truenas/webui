import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { ChartMetadata } from 'app/interfaces/catalog.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
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
  storage_class: Record<string, string>;
  persistent_volumes: unknown[];
  host_path_volumes: unknown[];
  container_images: Record<string, ChartContainerImage>;
  truenas_certificates: number[];
  truenas_certificate_authorities: number[];
  cronjobs: unknown[];
  deployments: unknown[];
  jobs: unknown[];
  persistent_volume_claims: unknown[];
  pods: unknown[];
  statefulsets: unknown[];
}

export type ChartFormValue = string | number | boolean | Record<string, unknown> | ChartFormValue[];

export interface ChartFormValues extends HierarchicalObjectMap<ChartFormValue> {
  release_name: string;
  version?: string;
}

export interface ChartRelease {
  name: string;
  title: string;
  info: ChartInfo;
  config: Record<string, ChartFormValue>;
  hooks: unknown[];
  version: number;
  namespace: string;
  chart_metadata: ChartMetadata;
  app_metadata: AppMetadata;
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
  portals: Record<string, string[]>;
  chart_schema: ChartSchema;
  history: Record<string, ChartReleaseVersion>;
  resources?: ChartResources;
  stats?: ChartReleaseStats;
}

export interface ChartReleaseStats {
  cpu: number;
  memory: number;
  network: {
    incoming: number;
    outgoing: number;
  };
}

export interface ChartReleaseVersion {
  catalog: string;
  catalog_train: string;
  chart_metadata: ChartMetadata;
  config: Record<string, ChartFormValue>;
  human_version: string;
  id: string;
  info: ChartInfo;
  name: string;
  namespace: string;
  version: number;
}

export interface ChartReleaseCreate {
  values: Record<string, ChartFormValue>;
  catalog: string;
  item: string;
  release_name: string;
  train: string;
  version: string;
}

export interface ChartReleaseUpdate {
  values: Record<string, ChartFormValue>;
}

export interface ChartReleaseUpgrade {
  item_version?: string;
  values?: Record<string, ChartFormValue>;
}

export type ChartReleaseQueryParams = QueryParams<ChartRelease, {
  extra?: {
    retrieve_resources?: boolean;
    include_chart_schema?: boolean;
    history?: boolean;
    stats?: boolean;
  };
}>;

export type ChartReleaseUpgradeParams = [
  name: string,
  params?: {
    item_version: string;
  },
];

export interface ChartContainerImage {
  id: string;
  update_available: boolean;
}

export interface ChartSchemaEnum {
  value: string;
  description: string;
}

export interface ChartSchemaNodeConf {
  type: ChartSchemaType;
  attrs?: ChartSchemaNode[];
  null?: boolean;
  items?: ChartSchemaNode[];
  default?: unknown;
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
  show_subquestions_if?: ChartFormValue;
  editable?: boolean;
  immutable?: boolean;
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
    portals: Record<string, {
      host: string[];
      ports: string[];
      protocols: string[];
    }>;
  };
  supported: boolean;
  values: Record<string, ChartFormValue>;
}

export interface AppMetadata {
  runAsContext?: {
    description: string;
    gid?: number;
    groupName?: string;
    userName?: string;
    uid?: number;
  }[];
  capabilities?: {
    description: string;
    name: string;
  }[];
  hostMounts?: {
    description: string;
    hostPath: string;
  }[];
}
