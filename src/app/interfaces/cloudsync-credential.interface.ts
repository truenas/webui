import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

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
