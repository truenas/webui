export interface WebShareConfig {
  id: number;
  search: boolean;
}

export type WebShareConfigUpdate = Partial<Omit<WebShareConfig, 'id'>>;

export interface WebShare {
  id: number;
  name: string;
  path: string;
  locked?: boolean;
  is_home_base?: boolean;
}

export type WebShareUpdate = Omit<WebShare, 'id' | 'locked'>;

export type WebShareSummary = Pick<WebShare, 'name' | 'path'>;
