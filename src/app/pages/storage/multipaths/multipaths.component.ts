import { Component } from '@angular/core';

import { EntityTreeTable } from '../../common/entity/entity-tree-table/entity-tree-table.model';

@Component({
    selector: 'app-storage-multipath',
    templateUrl: './multipaths.component.html',
})
export class MultipathsComponent {

    public treeTableConfig: EntityTreeTable = {
        tableData: [],
        columns: [
            { name: 'Name', prop: 'name', },
            { name: 'Status', prop: 'status', },
            { name: 'LUN ID', prop: 'lunid', },
        ]
    }
    constructor() {}
    
}