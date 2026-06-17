import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface PullContainerImageParams {
  auth_config?: {
    username: string;
    password: string;
  };
  image: string;
}

export type DeleteContainerImageParams = [
  id: string,
  forceSetting?: { force: boolean },
];

export interface PullContainerImageResponse {
  status: string;
}

export interface ParsedRepoTag {
  image: string;
  tag: string;
  registry: string;
  complete_tag: string;
}

export interface ContainerImage {
  id: string;
  repo_tags: string[];
  repo_digests: string[];
  size: number;
  dangling: boolean;
  created: ApiTimestamp;
  author: string;
  comment: string;
  parsed_repo_tags: ParsedRepoTag[];

  state?: string;
}
