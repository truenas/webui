import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
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

export interface AppHostPort {
  host_port: string;
  host_ip: string;
}

export interface AppUsedPort {
  container_port: string;
  protocol: string;
  host_ports?: AppHostPort[];
}

export enum AppContainerState {
  Running = 'running',
  Starting = 'starting',
  Exited = 'exited',
}

export interface AppContainerDetails {
  service_name: string;
  image: string;
  state: AppContainerState;
  port_config: AppUsedPort[];
  volume_mounts: unknown[];
}

export interface AppContainerVolumes {
  source: string;
  destination: string;
  mode: string;
  type: 'bind' | 'volume';
}

export interface AppActiveWorkloads {
  containers: number;
  user_ports: AppUsedPort[];
  container_details: AppContainerDetails[];
  volumes: AppContainerVolumes[];
}

export interface App {
  name: string;
  title: string;
  info: ChartInfo;
  config: Record<string, ChartFormValue>;
  hooks: unknown[];
  namespace: string;
  app_metadata: AppMetadata;
  id: string;
  catalog: string;
  catalog_train: string;
  path: string;
  dataset: string;
  used_ports: UsedPort[];
  pod_status: PodStatus;
  state: CatalogAppState;
  upgrade_available: boolean;
  human_version: string;
  human_latest_version: string;
  container_images_update_available: boolean;
  portals: Record<string, string[]>;
  chart_schema: ChartSchema;
  history: Record<string, ChartReleaseVersion>;
  resources?: ChartResources;
  version: number;
  metadata: ChartMetadata;
  active_workloads: AppActiveWorkloads;
}

export interface ChartStatisticsUpdate {
  id: string;
  stats: ChartReleaseStats;
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
  metadata: ChartMetadata;
  config: Record<string, ChartFormValue>;
  human_version: string;
  id: string;
  info: ChartInfo;
  name: string;
  namespace: string;
  version: number;
}

export interface AppCreate {
  values: Record<string, ChartFormValue>;
  app_name: string;
  catalog_app: string;
  train: string;
  version: string;
}

export interface AppUpdate {
  values: Record<string, ChartFormValue>;
}

export interface AppUpgrade {
  app_version?: string;
  values?: Record<string, ChartFormValue>;
}

export type ChartReleaseQueryParams = QueryParams<App, {
  extra?: {
    retrieve_config?: boolean;
    retrieve_resources?: boolean;
    include_chart_schema?: boolean;
    history?: boolean;
    stats?: boolean;
  };
}>;

export type AppUpgradeParams = [
  name: string,
  params?: AppUpgrade,
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
  language?: CodeEditorLanguage;
  attrs?: ChartSchemaNode[];
  null?: boolean;
  items?: ChartSchemaNode[];
  default?: unknown;
  enum?: ChartSchemaEnum[];
  required?: boolean;
  empty?: boolean;
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
  metadata: ChartMetadata;
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
