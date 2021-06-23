export interface CloudsyncCredential {
  attributes: {
    [attribute: string]: string;
  };
  id: number;
  name: string;
  provider: string;
}
