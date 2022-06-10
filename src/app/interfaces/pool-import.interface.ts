import { ImportDiskFilesystem } from 'app/enums/import-disk-filesystem-type.enum';
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

export type ImportDiskParams = [
  device: string,
  fsType: ImportDiskFilesystem,
  options: {
    locale?: string;
  },
  dstPath: string,
];
