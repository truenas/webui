import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';

export interface CloudSyncCredential {
  attributes: Record<string, string | number | boolean>;
  id: number;
  name: string;
  provider: CloudSyncProviderName;
}

export type CloudSyncCredentialUpdate = Omit<CloudSyncCredential, 'id'>;

export type CloudSyncCredentialVerify = Pick<CloudSyncCredential, 'provider' | 'attributes'>;

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
