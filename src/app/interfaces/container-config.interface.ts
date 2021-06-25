export interface ContainerConfig {
  enable_image_updates: boolean;
  id: number;
}

export type ContainerConfigUpdate = Omit<ContainerConfig, 'id'>;
