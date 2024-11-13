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

export interface Statfs {
  flags: unknown[];
  fstype: string;
  source: string;
  dest: string;
  blocksize: number;
  total_blocks: number;
  free_blocks: number;
  avail_blocks: number;
  files: number;
  free_files: number;
  name_max: number;
  fsid: unknown[];
  total_bytes: number;
  free_bytes: number;
  avail_bytes: number;
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
