import { JobParams } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/** What `zfs.resource.encryption.change_key` takes. */
export type DatasetChangeKeyParams = JobParams<WebUiApiDirectory, 'zfs.resource.encryption.change_key'>[0];
