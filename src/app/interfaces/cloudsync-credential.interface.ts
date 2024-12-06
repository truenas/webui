import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

export interface CloudSyncCredential {
  id: number;
  name: string;
  provider: Record<string, string | number | boolean> & {
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
