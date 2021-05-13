export interface PullContainerImageParams {
  docker_authentication?: {
    username: string;
    password: string;
  };
  from_image: string;
  tag?: string;
}
