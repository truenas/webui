import {
  Component, ElementRef, Input, OnInit, ViewChild,
} from '@angular/core';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';

export interface InputExpandableTableConf extends InputTableConf {
  alwaysCollapsed?: boolean;
  collapsedIfEmpty?: boolean;
  alwaysExpanded?: boolean;
  expandedIfNotEmpty?: boolean;
  detailsHref?: string;
  expandableTableComponent?: ExpandableTableComponent;
  limitRows?: number;
  limitRowsByMaxHeight?: boolean;
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
  disabled = false;
  isEmpty = true;
  isExpanded = false;
  _tableConf: InputExpandableTableConf;

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

  @ViewChild('appTable', { read: ElementRef })
  appTable: ElementRef;

  populateTable(): void {
    this.title = this.tableConf.title || '';
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
      this.disabled = (this.isEmpty && this.tableConf.collapsedIfEmpty)
        || this.tableConf.alwaysCollapsed
        || this.tableConf.alwaysExpanded
        || (!this.isEmpty && this.tableConf.expandedIfNotEmpty);
      if (this.tableConf.limitRows) {
        return data.splice(0, this.tableConf.limitRows);
      }
      return data;
    };
  }

  updateAlwaysExpanded(alwaysExpanded: boolean): void {
    this.tableConf.alwaysExpanded = alwaysExpanded;
  }

  ngAfterViewChecked(): void {
    if (this._tableConf.limitRows
      && this.appTable.nativeElement.children[0].children[1].children[0].children[0].children[0].children[0].children[0].children[0] && this.appTable.nativeElement.children[1] && !this.shouldBeCollapsed()) {
      const tableHeaderHeight = this.appTable.nativeElement.children[0].children[1].children[0].children[0].children[0].children[0].children[0].children[0].children[0].offsetHeight;
      const expandableHeaderHeight = this.appTable.nativeElement.children[0].children[0].offsetHeight;
      const detailsFooterHeight = this.appTable.nativeElement.children[1].offsetHeight;
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

  shouldBeCollapsed(): boolean {
    return this.tableConf.alwaysCollapsed || (this.isEmpty && this.tableConf.collapsedIfEmpty);
  }

  shouldBeExpanded(): boolean {
    return this.tableConf.alwaysExpanded || (!this.isEmpty && this.tableConf.expandedIfNotEmpty);
  }

  shouldDetailsShow(): boolean {
    return this.shouldBeExpanded() && (!!this.tableConf.detailsHref);
  }
}
