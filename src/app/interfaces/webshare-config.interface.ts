import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';

export interface WebShareConfig {
  id: number;
  search: boolean;
  passkey: WebSharePasskey;
}

export interface WebShareConfigUpdate {
  search?: boolean;
  passkey?: WebSharePasskey;
}

export interface WebShare {
  id: number;
  name: string;
  path: string;
  locked?: boolean;
  is_home_base?: boolean;
}

export type WebShareUpdate = Omit<WebShare, 'id' | 'locked'>;

export type WebShareSummary = Pick<WebShare, 'name' | 'path'>;
