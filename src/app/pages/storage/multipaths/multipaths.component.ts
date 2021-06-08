import { Component } from '@angular/core';
import { EntityTreeTable } from 'app/pages/common/entity/entity-tree-table/entity-tree-table.model';

@Component({
  selector: 'app-storage-multipath',
  templateUrl: './multipaths.component.html',
})
export class MultipathsComponent {
  treeTableConfig: EntityTreeTable = {
    columns: [
      { name: 'Name', prop: 'name' },
      { name: 'Status', prop: 'status' },
      { name: 'LUN ID', prop: 'lun_id' },
    ],
    queryCall: 'multipath.query',
  };
}
