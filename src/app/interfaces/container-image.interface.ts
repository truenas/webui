import { CallParams, JobParams } from '@truenas/api-client';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type PullContainerImageParams = JobParams<WebUiApiDirectory, 'app.image.pull'>[0];

export type DeleteContainerImageParams = CallParams<WebUiApiDirectory, 'app.image.delete'>;

export type ContainerImage = WebUiQueryEntity<'app.image.query'>;
