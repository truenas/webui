export interface PoolDiskInfo {
  name: string;
  read: number;
  write: number;
  checksum: number;
  status: any;
  actions?: any;
  path?: string;
  guid: string;
}
