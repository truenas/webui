import { Component, OnInit, Input } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
	selector: 'entity-tree-table',
	templateUrl: './entity-tree-table.component.html'
})
export class EntityTreeTableComponent implements OnInit {
	@Input('conf') conf: any;

	showActions = true;
	columns: any[];

	constructor() { }

	ngOnInit() {
		this.columns = this.conf.columns;
	}
}