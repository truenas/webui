import { CloudsyncProviderName, OneDriveType } from 'app/enums/cloudsync-provider.enum';

export interface CloudsyncCredential {
  attributes: {
    [attribute: string]: string | number | boolean;
  };
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
}

export interface CloudsyncOneDriveDrive {
  drive_type: OneDriveType;
  drive_id: string;
}

export interface CloudsyncOneDriveParams {
  client_id: string;
  client_secret: string;
  token: string;
}
