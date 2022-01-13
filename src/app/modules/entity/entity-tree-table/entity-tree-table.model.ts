import { TreeNode } from 'primeng/api';
import { ApiMethod } from 'app/interfaces/api-directory.interface';

export interface EntityTreeTableColumn {
  name: string;
  prop: string;
  filesizePipe?: boolean;
  hidden?: boolean;
  always_display?: boolean;
  sortBy?: string; // can use dot notation for nested properties e.g., obj.property.sub
}

export interface EntityTreeTable {
  tableData?: TreeNode[];
  columns: EntityTreeTableColumn[];
  queryCall?: ApiMethod;
}
