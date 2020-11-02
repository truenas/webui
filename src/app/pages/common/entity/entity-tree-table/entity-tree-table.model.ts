import { TreeNode } from 'primeng/api';

export class EntityTreeTableColumn {
    name: string;
    prop: string;
    filesizePipe?: boolean;
    hidden?: boolean;
    always_display?: boolean
}

export class EntityTreeTable {
    tableData?: TreeNode[];
    columns: Array<EntityTreeTableColumn>;
    queryCall?: string;
}
