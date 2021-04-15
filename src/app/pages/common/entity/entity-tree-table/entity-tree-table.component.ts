import { Component, Input, OnInit } from '@angular/core';
import { SortEvent, TreeNode } from 'primeng/api';
import { DialogService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../utils';
import { EntityTreeTable } from './entity-tree-table.model';
import { EntityTreeTableService } from './entity-tree-table.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'entity-tree-table',
  templateUrl: './entity-tree-table.component.html',
  styleUrls: ['./entity-tree-table.component.css'],
  providers: [EntityTreeTableService],
})
export class EntityTreeTableComponent implements OnInit {
  @Input() conf: EntityTreeTable;
  @Input() expandRootNodes = false;

  showActions = true;
  treeTableData: TreeNode[] = [];

  constructor(private ws: WebSocketService,
    private treeTableService: EntityTreeTableService,
    private dialogService: DialogService,
    protected translate: TranslateService) { }

  ngOnInit() {
    if (this.conf.queryCall) {
      this.getData();
    } else if (this.conf.tableData && this.expandRootNodes) {
      /* Expand the root nodes by default */
      this.conf.tableData.filter((node) => !node.parent).forEach((node) => (node.expanded = true));
    }
  }

  getData() {
    this.ws.call(this.conf.queryCall).subscribe(
      (res) => {
        this.treeTableData = this.treeTableService.buildTree(res);
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      },
    );
  }
  clickAction() {
    return null;
  }
  customSort(event: SortEvent) {
    event.data.sort((data1, data2) => {
      const value1 = data1.data[event.field];
      const value2 = data2.data[event.field];

      let result = null;

      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string') result = value1.localeCompare(value2);
      else result = (value1 < value2) ? -1 : (value1 > value2) ? 1 : 0;

      return (event.order * result);
    });
  }
}
