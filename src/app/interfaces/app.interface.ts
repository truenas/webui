import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { AppMaintainer } from 'app/interfaces/available-app.interface';
import { ChartMetadata } from 'app/interfaces/catalog.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';

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

export const appContainerStateLabels = new Map<AppContainerState, string>([
  [AppContainerState.Running, T('Running')],
  [AppContainerState.Starting, T('Starting')],
  [AppContainerState.Exited, T('Exited')],
]);

export interface AppContainerDetails {
  id: string;
  image: string;
  service_name: string;
  state: AppContainerState;
  port_config: AppUsedPort[];
  volume_mounts: AppContainerVolumes[];
}

export interface AppContainerVolumes {
  source: string;
  destination: string;
  mode: string;
  type: 'bind' | 'volume';
}

export interface AppActiveWorkloads {
  containers: number;
  used_ports: AppUsedPort[];
  container_details: AppContainerDetails[];
  volumes: AppContainerVolumes[];
  images: string[];
}

export interface App {
  name: string;
  id: string;
  active_workloads: AppActiveWorkloads;
  state: CatalogAppState;
  upgrade_available: boolean;
  human_version: string;
  metadata: AppMetadata;
  notes: string;
  portals: Record<string, string>;
  version: string;
  migrated: boolean;
  /**
   * Present with `retrieve_config` query param.
   */
  config?: Record<string, ChartFormValue>;
  /**
   * Presents with `include_app_schema` query param.
   */
  version_details?: ChartSchema;
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

export type AppQueryParams = QueryParams<App, {
  extra?: {
    /**
     * host_ip is a string which can be provided to override portal IP address if it is a wildcard.
     */
    host_ip?: string;

    /**
     * include_app_schema is a boolean which can be set to include app schema in the response.
     */
    include_app_schema?: boolean;

    /**
     * is a boolean which can be set to retrieve app configuration used to install/manage app.
     */
    retrieve_config?: boolean;
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
  app_metadata: ChartMetadata;
  readme: string;
  changelog: string;
  detailed_readme: string;
  human_version: string;
  location: string;
  required_features: string[];
  schema: {
    groups: ChartSchemaGroup[];
    questions: ChartSchemaNode[];
    portals?: Record<string, {
      host: string[];
      ports: string[];
      protocols: string[];
    }>;
  };
  supported: boolean;
  values: Record<string, ChartFormValue>;
}

interface HostMount {
  description: string;
  hostPath: string;
}

interface Capability {
  name: string;
  description: string;
}

interface AppRunAsContext {
  description: string;
  gid: number;
  group_name: string;
  uid: number;
  user_name: string;
}

export interface AppMetadata {
  app_version: string;
  capabilities: Capability[];
  categories: string[];
  description: string;
  home: string;
  host_mounts: HostMount[];
  icon: string;
  keywords: string[];
  last_update: string;
  lib_version: string;
  lib_version_hash: string;
  maintainers: AppMaintainer[];
  name: string;
  run_as_context: AppRunAsContext[];
  screenshots: string[];
  sources: string[];
  title: string;
  train: string;
  version: string;
}

export type AppStartQueryParams = [
  name: string,
];
export type AppDeleteParams = [
  string,
  {
    remove_images?: boolean;
    remove_ix_volumes?: boolean;
  },
];

export type AppRollbackParams = [app_name: string, { app_version: string; rollback_snapshot: boolean }];
