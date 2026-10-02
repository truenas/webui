export interface WebShare {
  id: number;
  name: string;
  path: string;
  locked?: boolean;
  is_home_base?: boolean;
}

export type WebShareUpdate = Omit<WebShare, 'id' | 'locked'>;
