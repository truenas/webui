import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { DialogService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../entity/utils';
import { EntityTreeTable } from './entity-tree-table.model';
import { EntityTreeTableService } from './entity-tree-table.service';

@Component({
	selector: 'entity-tree-table',
	templateUrl: './entity-tree-table.component.html',
	providers: [EntityTreeTableService]
})
export class EntityTreeTableComponent implements OnInit {
	@Input() conf: EntityTreeTable;
	@Input() expandRootNodes = false;

	showActions = true;
	treeTableData: Array<TreeNode> = [];

	constructor(private ws: WebSocketService,
		private treeTableService: EntityTreeTableService,
		private dialogService: DialogService) { }

	ngOnInit() {
		if (this.conf.queryCall) {
			this.getData();
		} else if (this.conf.tableData && this.expandRootNodes) {
			/* Expand the root nodes by default */
			this.conf.tableData.filter(node => !node.parent).forEach(node => (node.expanded = true));
		}
	}

	getData() {
		this.ws.call(this.conf.queryCall).subscribe(
			(res) => {
				this.treeTableData = this.treeTableService.buildTree(res);
			},
			(err) => {
				new EntityUtils().handleWSError(this, err, this.dialogService);
			}
		);
	}
}