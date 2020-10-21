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
  
  filter: FilterValue = { column: 'name', value: ''};
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
      let cols = this.conf.columns.filter(col => !col.hidden || col.always_display == true);
      this.displayedColumns = cols.map(col => col.prop);

      const mutated = Object.assign([], this.conf.tableData);
      
      this.treeDataSource = this.conf.tableData;
      let flattened = this.treeTableService.buildTable(mutated);
      this.tableDataSource = flattened;
      
      if (this.conf.queryCall) {
        this.getData();
      }
    }

    ngAfterViewInit(){
      this.core.register({ observerClass: this, eventName: "TreeTableGlobalFilter" }).subscribe((evt: CoreEvent) => {
        const value = evt.data.value ? evt.data.value : '';
        this.filterNodes(evt.data.column, value);
      });

      if (this.conf.tableData && this.expandRootNodes) {
        // Expand the root nodes by default
        this.expandNode(this.tableDataSource[0]);
      }
    }

    getData() {
      this.ws.call(this.conf.queryCall).subscribe(
        (res) => {
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
      const value = rootNode.expanded ? rootNode.expanded = false : true;
      this.treeDataSource = this.treeTableService.editNode('expanded', value, rootNode.indexPath, this.treeDataSource);

      if(this.filter.value.length > 0){
        this.tableDataSource = this.treeTableService.filteredTable(this.filter.column, this.filter.value, this.treeDataSource, true);
      } else {
        this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource); 
      }

      this.table.renderRows();
    }

    filterNodes(key: string, value: any){ 
      if(value.length > 0){
        this.tableDataSource = this.treeTableService.filteredTable(key, value, this.treeDataSource);
      } else {
        this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource); 
      }
      this.filter = { column: key, value: value };
      this.table.renderRows();
    }

}
