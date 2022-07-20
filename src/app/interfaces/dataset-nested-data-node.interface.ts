import { DatasetInTree } from 'app/pages/datasets/store/dataset-in-tree.interface';

export interface DatasetRoot {
  children: DatasetInTree[];
  id: string;
  name: string;
  pool: string;
}

export type DatasetNestedDataNode = DatasetInTree | DatasetRoot;

export function isDatasetInTree(obj: DatasetNestedDataNode): obj is DatasetInTree {
  return 'encrypted' in obj;
}
