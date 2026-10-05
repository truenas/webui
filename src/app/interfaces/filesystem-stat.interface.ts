export interface FileSystemStat {
  acl: boolean;
  atime: number;
  ctime: number;
  dev: number;
  gid: number;
  group: string;
  inode: number;
  mode: number;
  mtime: number;
  nlink: number;
  size: number;
  uid: number;
  user: string;
}

export type FilesystemPutParams = [
  path: string,
  options?: {
    mode?: number;
    append?: boolean;
  },
];

export interface FilesystemSetPermParams {
  path: string;
  mode: string;
  uid?: number;
  user?: string;
  gid?: number;
  group?: string;
  options: {
    stripacl?: boolean;
    recursive?: boolean;
    traverse?: boolean;
  };
}
