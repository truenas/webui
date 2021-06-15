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

export interface Resources {
  storage_class: { [key: string]: string };
  persistent_volumes: any[];
  host_path_volumes: any[];
  container_images: { [key: string]: string };
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
  'values': { [key: string]: string };
  'catalog': string;
  'item': string;
  'release_name': string;
  'train': string;
  'version': string;
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
  resources: Resources;
}
