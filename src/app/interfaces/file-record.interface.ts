import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';

export interface FileRecord {
  acl: boolean;
  gid: number;
  mode: number;
  name: string;
  path: string;
  realpath: string;
  size: number;
  type: FileType;
  uid: number;
  is_ctldir: boolean;
  is_mountpoint: boolean;
  attributes: FileAttribute[];
}
