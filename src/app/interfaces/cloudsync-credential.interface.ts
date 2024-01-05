import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';

export interface CloudsyncCredential {
  attributes: Record<string, string | number | boolean>;
  id: number;
  name: string;
  provider: CloudsyncProviderName;
}

export type CloudsyncCredentialUpdate = Omit<CloudsyncCredential, 'id'>;

export type CloudsyncCredentialVerify = Pick<CloudsyncCredential, 'provider' | 'attributes'>;

export interface CloudsyncCredentialVerifyResult {
  error?: string;
  excerpt?: string;
  valid: boolean;
}

export interface CloudsyncBucket {
  Name: string;
  Path: string;
  Enabled: boolean;
}
