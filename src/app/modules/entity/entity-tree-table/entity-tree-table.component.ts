import {
  Component, ViewChild, Input, OnInit, AfterViewInit, ElementRef,
} from '@angular/core';
import { Sort } from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TreeNode } from 'primeng/api';
import { TreeTableGlobalFilterEvent } from 'app/interfaces/events/tree-table-global-filter-event.interface';
import { EntityTreeTable } from 'app/modules/entity/entity-tree-table/entity-tree-table.model';
import { EntityTreeTableService } from 'app/modules/entity/entity-tree-table/entity-tree-table.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';

interface FilterValue {
  column: string;
  value: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-entity-tree-table',
  templateUrl: './entity-tree-table.component.html',
  styleUrls: ['./entity-tree-table.component.scss'],
  providers: [EntityTreeTableService],
})
export class EntityTreeTableComponent implements OnInit, AfterViewInit {
  @ViewChild(MatTable, { static: false }) table: MatTable<unknown>;
  _conf: EntityTreeTable;
  @Input()
  set conf(conf: EntityTreeTable) {
    if (this._conf) {
      this._conf = conf;
      this.populateTable();
    } else {
      this._conf = conf;
    }
  }
  get conf(): EntityTreeTable {
    return this._conf;
  }

  @Input() expandRootNodes = false;
  @Input() parentId?: string;

  filter: FilterValue = { column: 'name', value: '' };

  // Table Props
  displayedColumns: string[];
  treeDataSource: TreeNode[];
  tableDataSource: TreeNode[];

  constructor(
    private ws: WebSocketService,
    private treeTableService: EntityTreeTableService,
    private dialogService: DialogService,
    protected core: CoreService,
  ) { }

  ngOnInit(): void {
    this.populateTable();
  }

  populateTable(): void {
    this.fillTable();
    if (this._conf.queryCall) {
      this.getData();
    }
  }

  fillTable(): void {
    const cols = this._conf.columns.filter((col) => !col.hidden || col.always_display);
    this.displayedColumns = cols.map((col) => col.prop);

    const mutated = Object.assign([], this._conf.tableData);

    this.treeDataSource = this._conf.tableData;
    const flattened = this.treeTableService.buildTable(mutated);
    this.tableDataSource = flattened;
  }

  sortTable(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    const col = this._conf.columns[this._conf.columns.findIndex((column) => column.prop === sort.active)];
    this._conf.tableData = this.sortData({ ...sort, sortBy: col.sortBy ? col.sortBy : col.prop }, this._conf.tableData);
    this.fillTable();
  }

  sortData(sort: { active: string; direction: string; sortBy: string }, nodes: TreeNode[]): TreeNode[] {
    for (const node of nodes) {
      if (node.children && node.children.length) {
        node.children = this.sortData(sort, node.children);
      }
    }

    return nodes.sort((data1, data2) => {
      const isAsc = sort.direction === 'asc';

      const value1 = this.resolve(sort.sortBy, data1.data);
      const value2 = this.resolve(sort.sortBy, data2.data);

      let result: number;

      switch (true) {
        case value1 === null && value2 !== null:
          result = -1;
          break;
        case value1 !== null && value2 === null:
          result = 1;
          break;
        case value1 === null && value2 === null:
          result = 0;
          break;
        case typeof value1 === 'string' && typeof value2 === 'string':
          result = value1.localeCompare(value2);
          break;
        case value1 < value2:
          result = -1;
          break;
        case value1 > value2:
          result = 1;
          break;
        default:
          result = 0;
      }

      return ((isAsc ? 1 : -1) * result);
    });
  }

  resolve(path: string, obj: any): string {
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj || {});
  }

  ngAfterViewInit(): void {
    this.core.register({ observerClass: this, eventName: 'TreeTableGlobalFilter' }).pipe(untilDestroyed(this)).subscribe((evt: TreeTableGlobalFilterEvent) => {
      const value = evt.data.value ? evt.data.value : '';
      this.filterNodes(evt.data.column, value);
    });

    if (this._conf.tableData && this.expandRootNodes) {
      // Expand the root nodes by default
      this.expandNode(this.tableDataSource[0]);
    }
  }

  // TODO: This block does nothing.
  getData(): void {
    this.ws.call(this._conf.queryCall).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        this.treeTableService.buildTree(res);
      },
      error: (err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }

  expandNode(rootNode: TreeNode): void {
    const value = rootNode.expanded ? rootNode.expanded = false : true;
    this.treeDataSource = this.treeTableService.editNode(
      'expanded',
      value,
      (rootNode as { indexPath: number[] }).indexPath,
      this.treeDataSource,
    );

    if (this.filter.value.length > 0) {
      this.tableDataSource = this.treeTableService.filteredTable(
        this.filter.column, this.filter.value, this.treeDataSource, true,
      );
    } else {
      this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource);
    }

    this.table.renderRows();
  }

  filterNodes(key: string, value: string): void {
    if (value.length > 0) {
      this.tableDataSource = this.treeTableService.filteredTable(key, value, this.treeDataSource);
    } else {
      this.tableDataSource = this.treeTableService.buildTable(this.treeDataSource);
    }
    this.filter = { column: key, value };
    this.table.renderRows();
  }

  onHover(evt: MouseEvent, over = true): void {
    const row = this.findRow(evt);
    const cells = row.children;

    for (const cell of cells) {
      if (cell.classList.contains('mat-table-sticky') || cell.classList.contains('action-cell')) {
        if (over) {
          cell.classList.add('hover');
        } else {
          cell.classList.remove('hover');
        }
      }
    }
  }

  findRow(event: MouseEvent): HTMLElement {
    let target = event.target as HTMLElement;

    do {
      target = target.parentElement;
    } while (target.tagName.toLowerCase() !== 'tr');
    return target;
  }

  isTableOverflow(): boolean {
    let hasHorizontalScrollbar = false;
    if (this.table) {
      // Hack to access the private property _elementRef. Do not replace with elementRef.
      const parentNode = (this.table as unknown as { _elementRef: ElementRef })._elementRef.nativeElement.parentNode;
      hasHorizontalScrollbar = parentNode.parentNode.scrollWidth > parentNode.parentNode.clientWidth;
    }
    return hasHorizontalScrollbar;
  }
}
