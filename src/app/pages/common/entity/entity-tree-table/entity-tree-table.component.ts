import { Component, OnInit, Input } from '@angular/core';
import { TreeNode } from 'primeng/api';

import { EntityTreeTable, EntityTreeTableColumn } from './entity-tree-table.model';
import { EntityTreeTableService } from './entity-tree-table.service';
import { WebSocketService, DialogService } from '../../../../services';
import { EntityUtils } from '../../entity/utils';

@Component({
	selector: 'entity-tree-table',
	templateUrl: './entity-tree-table.component.html',
	providers: [EntityTreeTableService]
})
export class EntityTreeTableComponent implements OnInit {
	@Input('conf') conf: EntityTreeTable;

	showActions = true;
	treeTableData: Array<TreeNode> = [];

	constructor(private ws: WebSocketService,
		private treeTableService: EntityTreeTableService,
		private dialogService: DialogService) { }

	ngOnInit() {
		if (this.conf.queryCall) {
			this.getData();
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