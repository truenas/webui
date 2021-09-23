import { DatasetType } from 'app/enums/dataset-type.enum';

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
