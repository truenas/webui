export interface DockerRegistry {
  id: number;
  name: string;
  username: string;
  password: string;
  uri: string;
  description: string | null;
}

export type DockerRegistryPayload = Omit<DockerRegistry, 'id'>;

export const dockerHubRegistry = 'https://registry-1.docker.io/';
