import { CallResponse, JobParams } from '@truenas/api-client';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type DockerConfig = CallResponse<WebUiApiDirectory, 'docker.config'>;

export type DockerConfigUpdate = JobParams<WebUiApiDirectory, 'docker.update'>[0];

export interface DockerStatusData {
  status: DockerStatus;
  description: string;
}

/**
 * Reads a `docker.status` response, or a `docker.state` event's fields, into the UI's
 * `DockerStatusData`. The generated model spells `status` as the wire literal, which the apps pages
 * compare with and look labels up by `DockerStatus`.
 */
export function toDockerStatusData(
  status: CallResponse<WebUiApiDirectory, 'docker.status'> | { status: string; description: string },
): DockerStatusData {
  return status as DockerStatusData;
}
