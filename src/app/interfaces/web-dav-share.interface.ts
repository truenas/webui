export interface WebDavShare {
  comment: string;
  enabled: boolean;
  id: number;
  locked: boolean;
  name: string;
  path: string;
  perm: boolean;
  ro: boolean;
}

export type WebDavShareUpdate = Omit<WebDavShare, 'id' | 'locked'>;
