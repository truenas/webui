import { FileAttribute } from 'app/enums/file-attribute.enum';
import { FileType } from 'app/enums/file-type.enum';
import { QueryFilter, QueryOptions } from 'app/interfaces/query-api.interface';

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

export type ListdirQueryParams = [
  path: string,
  filter: [QueryFilter<FileRecord>?],
  options: QueryOptions<FileRecord>,
];
