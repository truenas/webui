import { Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { TreeNode, FilterMetadata } from 'primeng/api';
import { TreeTable } from 'primeng/treetable';
import { DialogService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../entity/utils';
import { EntityTreeTable } from './entity-tree-table.model';
import { EntityTreeTableService } from './entity-tree-table.service';
import { TranslateService } from '@ngx-translate/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

interface FilterValue {
  column: string;
  value: string;
}

/*
interface FilterMetadata {
  value?: any;
  matchMode?: string;
}
*/

@Component({
	selector: 'entity-tree-table',
	templateUrl: './entity-tree-table.component.html',
	styleUrls: ['./entity-tree-table.component.css'],
	providers: [EntityTreeTableService]
})
export class EntityTreeTableComponent implements OnInit, AfterViewInit {
        @ViewChild('tt', {static: true}) tt : TreeTable;
	@Input() conf: EntityTreeTable;
	@Input() expandRootNodes = false;
        @Input() parentId?: string;

        //public filterValue: FilterMetadata;

	showActions = true;
	treeTableData: Array<TreeNode> = [];

	constructor(private ws: WebSocketService,
		private treeTableService: EntityTreeTableService,
		private dialogService: DialogService,
		protected translate: TranslateService,
                protected core: CoreService) { }

	ngOnInit() {
		if (this.conf.queryCall) {
			this.getData();
		} else if (this.conf.tableData && this.expandRootNodes) {
			/* Expand the root nodes by default */
			this.conf.tableData.filter(node => !node.parent).forEach(node => (node.expanded = true));
		}
	}

        ngAfterViewInit(){
          this.core.register({ observerClass: this, eventName: "TreeTableGlobalFilter" }).subscribe((evt: CoreEvent) => {
            if(this.tt){
              console.log(this.tt);
              this.tt.filterGlobal(evt.data.value, 'contains');
            }
          });

          if(this.parentId){
            this.core.register({ observerClass: this, eventName: "TreeTableFilter" + this.parentId }).subscribe((evt: CoreEvent) => {
              console.log(evt);
              
              
            });
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
	
        clickAction() {
		return null;
	}
}
