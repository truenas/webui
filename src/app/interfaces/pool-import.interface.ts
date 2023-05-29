import { PoolStatus } from 'app/enums/pool-status.enum';

export interface PoolFindResult {
  guid: string;
  hostname: string;
  name: string;
  status: PoolStatus;
}

export interface PoolImportParams {
  guid: string;
  name?: string;
  passphrase?: string;
  enable_attachments?: boolean;
}
