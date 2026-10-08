import { CallParams } from '@truenas/api-client';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type DockerRegistry = WebUiQueryEntity<'app.registry.query'>;

export type DockerRegistryPayload = CallParams<WebUiApiDirectory, 'app.registry.create'>[0];

export const dockerHubRegistry = 'https://index.docker.io/v1/';
