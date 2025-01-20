import { CloudSyncProviderName, OneDriveType } from 'app/enums/cloudsync-provider.enum';

export type SomeProviderAttributes = Record<string, string | number | boolean | string[] | number[] | boolean[]>;

export interface CloudSyncCredential {
  id: number;
  name: string;
  provider: SomeProviderAttributes & {
    type: CloudSyncProviderName;
  };
}

export type CloudSyncCredentialUpdate = Omit<CloudSyncCredential, 'id'>;

export type CloudSyncCredentialVerify = CloudSyncCredential['provider'];

export interface CloudSyncCredentialVerifyResult {
  error?: string;
  excerpt?: string;
  valid: boolean;
}

export interface CloudSyncBucket {
  Name: string;
  Path: string;
  Enabled: boolean;
}

export interface CloudSyncOneDriveDrive {
  name: string;
  description: string;
  drive_type: OneDriveType;
  drive_id: string;
}

export interface CloudSyncOneDriveParams {
  client_id: string;
  client_secret: string;
  token: string;
}
