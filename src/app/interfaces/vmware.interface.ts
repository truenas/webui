import { DatasetType } from 'app/enums/dataset.enum';

export interface MatchDatastoresWithDatasets {
  datastores: VmwareDatastore[];
  filesystems: VmwareFilesystem[];
}

export interface VmwareDatastore {
  name: string;
  description: string;
  filesystems: string[];
}

export interface VmwareFilesystem {
  type: DatasetType;
  name: string;
  description: string;
}

export interface MatchDatastoresWithDatasetsParams {
  hostname: string;
  username: string;
  password: string;
}

export interface VmwareSnapshot {
  id: number;
  datastore: string;
  filesystem: string;
  hostname: string;
  password: string;
  username: string;
}

export type VmwareSnapshotUpdate = Omit<VmwareSnapshot, 'id'>;
