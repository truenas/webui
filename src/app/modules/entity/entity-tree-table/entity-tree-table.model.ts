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

export interface EntityTreeTableActionGroup {
  title: string;
  actions: EntityTreeTableAction[];
}

export interface EntityTreeTableAction {
  onClick: (data: unknown) => void;
  label: string;

  // TODO: Not actually supported
  id?: string;
  isHidden?: boolean;
}
