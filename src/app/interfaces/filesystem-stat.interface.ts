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
