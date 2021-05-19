import { Component, Input, OnInit } from '@angular/core';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';

export interface InputExpandableTableConf extends InputTableConf {
  alwaysCollapsed?: boolean;
  collapsedIfEmpty?: boolean;
  alwaysExpanded?: boolean;
}

@Component({
  selector: 'app-expandable-table',
  templateUrl: './expandable-table.component.html',
})
export class ExpandableTableComponent {
  title = '';
  titleHref: string;
  actions: any[];
  disabled: boolean;

  @Input('conf') tableConf: InputExpandableTableConf;

  ngOnInit() {
    this.title = this.tableConf.title || '';
    if (this.tableConf.titleHref) {
      this.titleHref = this.tableConf.titleHref;
    }
    if (this.tableConf.getActions || this.tableConf.deleteCall) {
      this.actions = this.tableConf.getActions ? this.tableConf.getActions() : []; // get all row actions
    }
    console.log('Expandable Table is here', this.tableConf);
    if (this.tableConf) {
      this.tableConf.expandable = true;
    }

    this.tableConf.afterGetDataExpandable = (data: any) => this.disabled = (data.length === 0 && this.tableConf.collapsedIfEmpty) || this.tableConf.alwaysCollapsed || this.tableConf.alwaysExpanded;
  }
}
