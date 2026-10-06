import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { JobParams } from '@truenas/api-client';
import { AppState } from 'app/enums/app-state.enum';
import { ChartSchemaType } from 'app/enums/chart-schema-type.enum';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';
import { AppMaintainer } from 'app/interfaces/available-app.interface';
import { ChartMetadata } from 'app/interfaces/catalog.interface';
import { HierarchicalObjectMap } from 'app/interfaces/hierarhical-object-map.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type ChartFormValue = string | number | boolean | Record<string, unknown> | ChartFormValue[] | null;

export interface ChartFormValues extends HierarchicalObjectMap<ChartFormValue> {
  release_name: string;
  version?: string;
}

export interface AppHostPort {
  host_port: number;
  host_ip: string;
}

export interface AppUsedPort {
  container_port: number;
  protocol: string;
  host_ports?: AppHostPort[];
}

export enum AppContainerState {
  Running = 'running',
  Starting = 'starting',
  Exited = 'exited',
  Crashed = 'crashed',
  Created = 'created',
}

export const appContainerStateLabels = new Map<AppContainerState, string>([
  [AppContainerState.Running, T('Running')],
  [AppContainerState.Starting, T('Starting')],
  [AppContainerState.Exited, T('Exited')],
  [AppContainerState.Crashed, T('Crashed')],
  [AppContainerState.Created, T('Created')],
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
  state: AppState;
  upgrade_available: boolean;
  action_required: boolean;
  latest_version: string;
  /**
   * Latest upstream app version available. Provided by backend for version comparison.
   */
  latest_app_version?: string;
  human_version: string;
  metadata: AppMetadata;
  notes: string;
  portals: Record<string, string>;
  version: string;
  migrated: boolean;
  custom_app: boolean;
  /**
   * Present with `retrieve_config` query param.
   */
  config?: Record<string, ChartFormValue>;
  /**
   * Presents with `include_app_schema` query param.
   */
  version_details?: ChartSchema;
}

/**
 * Reads an `app.query` row into the shape the apps pages are written against. The generated entry
 * types `metadata`, `portals`, `config` and `version_details` as open maps where the pages read the
 * catalog's structure, and spells `state` as the wire literal; it describes the same object.
 *
 * `metadata` is the catalog's metadata block, which the generated model leaves as
 * `{ [k: string]: unknown }`, so the two types do not overlap and the conversion goes through
 * `unknown`: nothing checks the fields the UI reads.
 */
export function toApp(app: WebUiQueryEntity<'app.query'>): App {
  return app as unknown as App;
}

export interface AppStats {
  app_name: string;
  /**
   * Percentage of cpu used by an app
   */
  cpu_usage: number;
  /**
   * Current memory(in bytes) used by an app
   */
  memory: number;
  networks: AppNetworkStats[];
  blkio: {
    /**
     * Blkio read bytes
     */
    read: number;
    /**
     * Blkio write bytes
     */
    write: number;
  };
}

interface AppNetworkStats {
  /**
   * Name of the interface use by the app
   */
  interface_name: string;
  /**
   * Received bytes/s by an interface
   */
  rx_bytes: number;
  /**
   * Transmitted bytes/s by an interface
   */
  tx_bytes: number;
}

/** One app's arguments to `app.upgrade`, as the bulk update sends them through `core.bulk`. */
export type AppUpgradeParams = JobParams<WebUiApiDirectory, 'app.upgrade'>;

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

export interface HostMount {
  description: string;
  hostPath: string;
}

export interface Capability {
  name: string;
  description: string;
}

export interface AppRunAsContext {
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
  changelog_url?: string;
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
export type AppRollbackParams = JobParams<WebUiApiDirectory, 'app.rollback'>;

export interface AppContainerLog {
  data: string;
  timestamp: string;
  msg?: string;
  collection?: string;
}
