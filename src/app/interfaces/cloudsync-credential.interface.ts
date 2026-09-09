import { CallResponse, v27_0_0 } from '@truenas/api-client';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type SomeProviderAttributes = Record<string, string | number | boolean | null | string[] | number[] | boolean[]>;

export interface CloudSyncCredential {
  id: number;
  name: string;
  provider: SomeProviderAttributes & {
    type: CloudSyncProviderName;
  };
}

/**
 * The credential as middleware declares it, with `provider` a union of one
 * model per provider. `CloudSyncCredential` is the UI's reading of the same
 * wire object; `CloudCredentialService` converts between the two.
 */
export type CloudSyncCredentialEntry = v27_0_0.CredentialsEntry;

export type CloudSyncCredentialUpdate = Omit<CloudSyncCredential, 'id'>;

export type CloudSyncCredentialVerify = CloudSyncCredential['provider'];

/** Not in the client's `v27_0_0` namespace (unchanged since v25.10), so derived from the directory. */
export type CloudSyncCredentialVerifyResult = CallResponse<WebUiApiDirectory, 'cloudsync.credentials.verify'>;

export interface CloudSyncBucket {
  Name: string;
  Path: string;
  Enabled: boolean;
}

/** `drive_type` is the wire literal; compare against `OneDriveType`. */
export type CloudSyncOneDriveDrive = v27_0_0.CloudSyncOneDriveListDrivesDrive;

export type CloudSyncOneDriveParams = v27_0_0.CloudSyncOneDriveListDrivesArgs;
