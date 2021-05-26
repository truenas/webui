import {
  Component, ElementRef, Input, OnInit, ViewChild,
} from '@angular/core';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';

export interface InputExpandableTableConf extends InputTableConf {
  detailsHref?: string;
  expandableTableComponent?: ExpandableTableComponent;
  limitRows?: number;
  limitRowsByMaxHeight?: boolean;
}

export enum ExpandableTableState {
  Expanded,
  Collapsed,
}

@Component({
  selector: 'app-expandable-table',
  templateUrl: './expandable-table.component.html',
  styleUrls: ['./expandable-table.component.scss'],
})
export class ExpandableTableComponent {
  title = '';
  titleHref: string;
  actions: any[];
  isEmpty = true;
  isExpanded = false;
  _tableConf: InputExpandableTableConf;

  ExpandatbleTableState = ExpandableTableState;

  get tableConf(): InputExpandableTableConf {
    return this._tableConf;
  }

  @Input('conf') set tableConf(conf: InputExpandableTableConf) {
    if (!this._tableConf) {
      this._tableConf = conf;
    } else {
      this._tableConf = conf;
      this.populateTable();
    }
    this._tableConf.expandableTableComponent = this;
  }

  @Input('expandableTableState') expandableTableState: ExpandableTableState;
  @Input('disabled') disabled: boolean;

  @ViewChild('appTable', { read: ElementRef })
  appTable: ElementRef;

  populateTable(): void {
    this.title = this.tableConf.title || '';
    this.tableConf.alwaysHideViewMore = true;
    if (this.tableConf.titleHref) {
      this.titleHref = this.tableConf.titleHref;
    }
    if (this.tableConf.getActions || this.tableConf.deleteCall) {
      this.actions = this.tableConf.getActions ? this.tableConf.getActions() : []; // get all row actions
    }
    if (this.tableConf) {
      this.tableConf.expandable = true;
    }

    this.tableConf.afterGetDataExpandable = (data: any) => {
      this.isEmpty = !data.length;
      this.disabled = true;
      if (this.tableConf.limitRows) {
        return data.splice(0, this.tableConf.limitRows);
      }
      return data;
    };
  }

  ngAfterViewChecked(): void {
    if (this.isExpanded) {
      const tableHeader = this.appTable.nativeElement.querySelector('thead');
      const detailsRow = this.appTable.nativeElement.querySelector('#actions-row');
      const expandableHeader = this.appTable.nativeElement.querySelector('mat-expansion-panel-header');
      const tableHeaderHeight = tableHeader ? tableHeader.offsetHeight : 0;
      const expandableHeaderHeight = expandableHeader ? expandableHeader.offsetHeight : 0;
      const detailsFooterHeight = detailsRow ? detailsRow.offsetHeight : 0;
      const totalHeight = this.appTable.nativeElement.offsetHeight;
      const maxRowsHeight = totalHeight - expandableHeaderHeight - tableHeaderHeight - detailsFooterHeight;
      if (this._tableConf.limitRowsByMaxHeight) {
        const prevRowsLimit = this._tableConf.limitRows;
        this._tableConf.limitRows = Math.floor(maxRowsHeight / 48);
        if (prevRowsLimit !== this._tableConf.limitRows) {
          this._tableConf = { ...this.tableConf };
        }
      }
    }
  }

  ngOnInit(): void {
    this.populateTable();
  }
}
