import { Component, ElementRef, ViewChild, Input, OnInit, AfterViewInit } from '@angular/core';
import { MatTableModule, MatTable } from '@angular/material/table';
import { DialogService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../entity/utils';
import { EntityTreeTable } from './entity-tree-table.model';
import { EntityTreeTableService } from './entity-tree-table.service';
import { TranslateService } from '@ngx-translate/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Sort } from '@angular/material/sort';
import { TreeNode } from 'primeng/api'

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
  @ViewChild(MatTable,{static: false}) table: any;
  _conf: EntityTreeTable;
  @Input()
  set conf(conf: EntityTreeTable) {
    if(this._conf) {
      this._conf = conf;
      this.populateTable();
    } else {
      this._conf = conf;
    }
  }
  get conf() { return this._conf; }
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
      this.populateTable();
    }

    populateTable() {
      this.fillTable();
      if (this._conf.queryCall) {
        this.getData();
      }
    }

    fillTable() {
      let cols = this._conf.columns.filter(col => !col.hidden || col.always_display == true);
      this.displayedColumns = cols.map(col => col.prop);

      const mutated = Object.assign([], this._conf.tableData);
      
      this.treeDataSource = this._conf.tableData;
      let flattened = this.treeTableService.buildTable(mutated);
      this.tableDataSource = flattened;
    }

    sortTable(sort: Sort) {
      if (!sort.active || sort.direction === '') {
        return;
      }
      const col = this._conf.columns[this._conf.columns.findIndex(c => c.prop === sort.active)];
      this._conf.tableData = this.sortData({...sort, sortBy: col.sortBy ?  col.sortBy : col.prop}, this._conf.tableData);
      this.fillTable();
    }

    sortData(sort: {active: string, direction: string, sortBy: string}, nodes: TreeNode[]): TreeNode[] {
      for(let node of nodes) {
        if(node.children && node.children.length) {
          node.children = this.sortData(sort, node.children);
        }
      }

      return nodes.sort((data1, data2) => {
        const isAsc = sort.direction === 'asc';
        
        let value1 = this.resolve(sort.sortBy, data1.data);
        let value2 = this.resolve(sort.sortBy, data2.data);

        let result = null;
  
        if (value1 == null && value2 != null)
          result = -1;
        else if (value1 != null && value2 == null)
          result = 1;
        else if (value1 == null && value2 == null)
          result = 0;
        else if (typeof value1 === 'string' && typeof value2 === 'string')
          result = value1.localeCompare(value2);
        else
          result = (value1 < value2) ? -1 : (value1 > value2) ? 1 : 0;
  
        return ((isAsc ? 1 : -1) * result);
      });
    }

    resolve(path, obj) {
      return path.split('.').reduce(function(prev, curr) {
          return prev ? prev[curr] : null
      }, obj || self)
    }
    ngAfterViewInit(){
      this.core.register({ observerClass: this, eventName: "TreeTableGlobalFilter" }).subscribe((evt: CoreEvent) => {
        const value = evt.data.value ? evt.data.value : '';
        this.filterNodes(evt.data.column, value);
      });

      if (this._conf.tableData && this.expandRootNodes) {
        // Expand the root nodes by default
        this.expandNode(this.tableDataSource[0]);
      }
    }

    getData() {
      this.ws.call(this._conf.queryCall).subscribe(
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

    onHover(evt, over = true){
      const row = this.findRow(evt);
      const cells = row.children;

      for(let i = 0; i < cells.length; i++){
        const cell = cells[i];

        if(cell.classList.contains('mat-table-sticky') || cell.classList.contains('action-cell')){
          if(over) {
            cell.classList.add('hover');
          } else {
            cell.classList.remove('hover');
          }
        }
      }

    }

    findRow(el){
      let target = el.target;

      do {
        target =target.parentElement;
      } while(target.tagName.toLowerCase() !== 'tr')
      return target;
    }

    isTableOverflow() {
      let hasHorizontalScrollbar = false;
      if(this.table) {
        hasHorizontalScrollbar = this.table._elementRef.nativeElement.parentNode.parentNode.scrollWidth > this.table._elementRef.nativeElement.parentNode.parentNode.clientWidth;
      }
      return hasHorizontalScrollbar;
    }
}
