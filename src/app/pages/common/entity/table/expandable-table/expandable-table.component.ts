import { Component, Input } from '@angular/core';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';
import { Observable } from 'rxjs';

export interface InputExpandableTableConf extends InputTableConf {
  alwaysCollapsed?: boolean;
  collapsedIfEmpty?: boolean;
  alwaysExpanded?: boolean;
  expandedIfNotEmpty?: boolean;
  detailsHref?: string;
  limitRows?: number;
  serviceStatus?: ServiceStatus;
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
  readonly ServiceStatus = ServiceStatus;

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

  getStatusClass(status: ServiceStatus): string {
    switch (status) {
      case ServiceStatus.Running:
        return 'fn-theme-primary';
      case ServiceStatus.Stopped:
        return 'fn-theme-red';
      default:
        return 'fn-theme-orange';
    }
  }

  shouldBeCollapsed(): boolean {
    return this.tableConf.alwaysCollapsed || (this.isEmpty && this.tableConf.collapsedIfEmpty);
  }

  shouldBeExpanded(): boolean {
    return this.tableConf.alwaysExpanded || (!this.isEmpty && this.tableConf.expandedIfNotEmpty);
  }
}
