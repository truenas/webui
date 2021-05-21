import { Component, Input, OnInit } from '@angular/core';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';

export interface InputExpandableTableConf extends InputTableConf {
  alwaysCollapsed?: boolean;
  collapsedIfEmpty?: boolean;
  alwaysExpanded?: boolean;
  expandedIfNotEmpty?: boolean;
  detailsHref?: string;
  limitRows?: number;
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

  @Input('conf') tableConf: InputExpandableTableConf;

  ngOnInit(): void {
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

  shouldBeCollapsed(): boolean {
    return this.tableConf.alwaysCollapsed || (this.isEmpty && this.tableConf.collapsedIfEmpty);
  }

  shouldBeExpanded(): boolean {
    return this.tableConf.alwaysExpanded || (!this.isEmpty && this.tableConf.expandedIfNotEmpty);
  }
}
