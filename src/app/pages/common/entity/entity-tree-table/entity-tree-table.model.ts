import { TreeNode } from 'primeng/api';

export class EntityTreeTableColumn {
  name: string;
  prop: string;
  filesizePipe?: boolean;
}

export class EntityTreeTable {
  tableData?: TreeNode[];
  columns: EntityTreeTableColumn[];
  queryCall?: string;
}
