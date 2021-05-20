import { Component, Input, OnInit } from '@angular/core';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';

export interface InputExpandableTableConf extends InputTableConf {
  alwaysCollapsed?: boolean;
  collapsedIfEmpty?: boolean;
  alwaysExpanded?: boolean;
  expandedIfNotEmpty?: boolean;
}

@Component({
  selector: 'app-expandable-table',
  templateUrl: './expandable-table.component.html',
})
export class ExpandableTableComponent {
  title = '';
  titleHref: string;
  actions: any[];
  disabled = false;
  isEmpty = true;

  @Input('conf') tableConf: InputExpandableTableConf;

  ngOnInit() {
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
    };
  }

  shouldBeCollapsed() {
    return this.tableConf.alwaysCollapsed || (this.isEmpty && this.tableConf.collapsedIfEmpty);
  }

  shouldBeExpanded() {
    return this.tableConf.alwaysExpanded || (!this.isEmpty && this.tableConf.expandedIfNotEmpty);
  }
}
