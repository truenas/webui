import { Component, OnInit, Input } from '@angular/core';
import { EntityTreeTable, EntityTreeTableColumn } from './entity-tree-table.model';
import { TreeNode } from 'primeng/api';

@Component({
	selector: 'entity-tree-table',
	templateUrl: './entity-tree-table.component.html'
})
export class EntityTreeTableComponent implements OnInit {
	@Input('conf') conf: EntityTreeTable;

	showActions = true;
	columns: Array<EntityTreeTableColumn>;

	constructor() { }

	ngOnInit() {
		this.columns = this.conf.columns;
	}
}