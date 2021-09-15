export interface CloudsyncCredential {
  attributes: {
    [attribute: string]: string;
  };
  id: number;
  name: string;
  provider: string;
}

export interface CloudsyncBucket {
  Name: string;
  Path: string;
}
