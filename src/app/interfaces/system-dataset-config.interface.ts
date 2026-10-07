import { CallResponse } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * Middleware's `systemdataset.config`. The UI's own reading named `is_decrypted`, `uuid_a` and `uuid_b`, which
 * middleware does not send.
 */
export type SystemDatasetConfig = CallResponse<WebUiApiDirectory, 'systemdataset.config'>;

export interface SystemDatasetUpdate {
  pool?: string;
  pool_exclude?: string;
}
