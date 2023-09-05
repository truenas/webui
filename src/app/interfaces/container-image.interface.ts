import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface PullContainerImageParams {
  docker_authentication?: {
    username: string;
    password: string;
  };
  from_image: string;
  tag?: string;
}

export type DeleteContainerImageParams = [
  id: string,
];

export interface PullContainerImageResponse {
  status: string;
}

export interface ContainerImage {
  created: ApiTimestamp;
  dangling: boolean;
  id: string;
  labels: { [label: string]: string };
  repo_digests: string[];
  repo_tags: string[];
  size: number;
  system_image: boolean;
  update_available: boolean;
  state?: string;
}
