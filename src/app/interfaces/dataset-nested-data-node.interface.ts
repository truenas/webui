import { DatasetDetails } from 'app/interfaces/dataset.interface';

export interface DatasetRoot {
  children: DatasetDetails[];
  id: string;
  name: string;
  pool: string;
}

export type DatasetNestedDataNode = DatasetDetails | DatasetRoot;

export function isDatasetInTree(obj: DatasetNestedDataNode): obj is DatasetDetails {
  return 'encrypted' in obj;
}
