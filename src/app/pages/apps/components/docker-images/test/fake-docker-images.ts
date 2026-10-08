import { ContainerImage } from 'app/interfaces/container-image.interface';

export const fakeDockerImagesDataSource = [{
  id: 'sha256:test1',
  repo_tags: [
    'truenas/webui:3.1',
  ],
  size: 742472,
  dangling: false,
}, {
  id: 'sha256:test2',
  repo_tags: [
    'truenas/middleware:0.1.2',
  ],
  size: 6099268,
  dangling: false,
}] as ContainerImage[];
