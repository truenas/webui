import { RsyncModuleMode } from 'app/enums/rsync-mode.enum';

export interface RsyncModule {
  auxiliary: string;
  comment: string;
  enabled: boolean;
  group: string;
  hostsallow: string[];
  hostsdeny: string[];
  id: number;
  locked: boolean;
  maxconn: number;
  mode: RsyncModuleMode;
  name: string;
  path: string;
  user: string;
}

export type RsyncModuleCreate = Omit<RsyncModule, 'id' | 'locked'>;
