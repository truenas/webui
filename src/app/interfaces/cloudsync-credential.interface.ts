export interface CloudsyncCredential {
  attributes: {
    [attribute: string]: string;
  };
  id: number;
  name: string;
  provider: string;
}

export type CloudsyncCredentialUpdate = Omit<CloudsyncCredential, 'id'>;

export type CloudsyncCredentialVerify = Pick<CloudsyncCredential, 'provider' | 'attributes'>;

export interface CloudsyncBucket {
  Name: string;
  Path: string;
}

export interface CloudsyncOneDriveDrive {
  drive_type: string;
  drive_id: string;
}

export interface CloudsyncOneDriveParams {
  client_id: string;
  client_secret: string;
  token: string;
}
