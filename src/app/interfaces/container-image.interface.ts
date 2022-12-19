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
  params?: { force: boolean },
];

export interface PullContainerImageResponse {
  status: string;
}

export interface ContainerImage {
  id: string;
  labels: { [label: string]: string };
  repo_tags: string[];
  repo_digests: string[];
  size: number;
  dangling: boolean;
  update_available: boolean;
  system_image: boolean;
  created: ApiTimestamp;
  state?: string;
  parsed_repo_tags?: {
    image?: string;
    tag?: string;
    registry?: string;
    complete_tag?: string;
  }[];
  complete_tags?: string[];
}
