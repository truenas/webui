import { Component, ElementRef, ViewChild, Input, OnInit, AfterViewInit } from '@angular/core';
import { MatTableModule, MatTable } from '@angular/material/table';
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

@Component({
  selector: 'entity-tree-table',
  templateUrl: './entity-tree-table.component.html',
  styleUrls: ['./entity-tree-table.component.css'],
  providers: [EntityTreeTableService]
})
export class EntityTreeTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTable,{static: false}) table: MatTable<any>;
  @Input() conf: EntityTreeTable;
  @Input() expandRootNodes = false;
  @Input() parentId?: string;

  showActions = true;

  // Table Props
  displayedColumns: string[];
  treeDataSource: any;
  tableDataSource: any[];

  constructor(private ws: WebSocketService,
    private treeTableService: EntityTreeTableService,
    private dialogService: DialogService,

    protected translate: TranslateService,
    protected core: CoreService) { }

    ngOnInit() {
      this.displayedColumns = this.conf.columns.map(col => col.prop);

      const mutated = Object.assign([], this.conf.tableData);
      console.warn("NEW POOL");
      console.warn(this.conf.tableData);
      console.log(mutated);
      
      this.treeDataSource = this.conf.tableData;
      let flattened = this.treeTableService.buildTable(mutated);
      this.tableDataSource = flattened;
      
      if (this.conf.queryCall) {
        this.getData();
      } else if (this.conf.tableData && this.expandRootNodes) {
        /* Expand the root nodes by default */
        //this.conf.tableData.filter(node => !node.parent).forEach(node => (node.expanded = true));
      }
    }

    ngAfterViewInit(){
      this.core.register({ observerClass: this, eventName: "TreeTableGlobalFilter" }).subscribe((evt: CoreEvent) => {
        console.log(evt);
      });

      if(this.parentId){
        this.core.register({ observerClass: this, eventName: "TreeTableFilter" + this.parentId }).subscribe((evt: CoreEvent) => {
          console.log(evt);
        });
      }
    }

    getData() {
      console.log("GETTING DATA...");
      this.ws.call(this.conf.queryCall).subscribe(
        (res) => {
          console.log(res);
          //this.treeTableData = this.treeTableService.buildTree(res);
          let data = this.treeTableService.buildTree(res);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        }
      );
    }

    clickAction() {
      return null;
    }

    expandNode(rootNode){
      console.log(this.treeDataSource);
      const value = rootNode.expanded ? rootNode.expanded = false : true;
      this.treeDataSource = this.treeTableService.editNode('expanded', value, rootNode.indexPath, this.treeDataSource);
      this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource); 
      this.table.renderRows();
    }

    /*filterNodes(key: string, value: any){ 
      this.treeDataSource = this.treeTableService.editNode('expanded', value, rootNode.indexPath, this.treeDataSource);
      this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource); 
      this.table.renderRows();
    }*/

}
