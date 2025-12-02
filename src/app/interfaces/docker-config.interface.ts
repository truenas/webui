import { DockerStatus } from 'app/enums/docker-status.enum';

export interface DockerConfig {
  id: number;
  pool: string;
  dataset: string;
  enable_image_updates: boolean;
  address_pools: DockerAddressPool[];
  migrate_applications?: boolean;
  registry_mirrors?: RegistryMirror[];
}

export interface RegistryMirror {
  url: string;
  insecure?: boolean;
}

export interface DockerAddressPool {
  base: string;
  size: number;
}

export interface DockerConfigUpdate {
  pool?: string | null;
  address_pools?: DockerAddressPool[];
  enable_image_updates?: boolean;
  registry_mirrors?: RegistryMirror[];
}

export interface DockerStatusData {
  status: DockerStatus;
  description: string;
}
