import {
  AfterViewChecked,
  Component, ElementRef, Input, OnInit, ViewChild,
} from '@angular/core';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';

export interface InputExpandableTableConf extends AppTableConfig {
  detailsHref?: string;
  expandableTableComponent?: ExpandableTableComponent;
  limitRows?: number;
  configure?: () => void;
  limitRowsByMaxHeight?: boolean;
  addButtonLabel?: string;
  tooltip?: {
    message?: string;
    header?: string;
  };
}

export enum ExpandableTableState {
  Expanded,
  Collapsed,
}

@Component({
  selector: 'ix-expandable-table',
  templateUrl: './expandable-table.component.html',
  styleUrls: ['./expandable-table.component.scss'],
})
export class ExpandableTableComponent implements OnInit, AfterViewChecked {
  title = '';
  titleHref: string;
  actions: AppTableAction[];
  isEmpty = true;
  isExpanded = false;
  readonly ServiceStatus = ServiceStatus;
  readonly ExpandableTableState = ExpandableTableState;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('conf') tableConf: InputExpandableTableConf;
  @Input() expandableTableState: ExpandableTableState;
  @Input() disabled: boolean;

  @ViewChild('tableComponent') tableComponent: TableComponent;

  @ViewChild('appTable', { read: ElementRef })
  appTable: ElementRef<HTMLElement>;

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

    this.tableConf.afterGetDataExpandable = (data) => {
      this.isEmpty = !data.length;
      this.disabled = true;
      if (this.tableConf.limitRows) {
        return data.slice(0, this.tableConf.limitRows);
      }
      return data;
    };
  }

  ngOnInit(): void {
    this.populateTable();
  }

  ngAfterViewChecked(): void {
    if (!this.isExpanded) {
      return;
    }
    const tableHeader = this.appTable.nativeElement.querySelector('thead');
    const detailsRow: HTMLElement = this.appTable.nativeElement.querySelector('#actions-row');
    const expandableHeader: HTMLElement = this.appTable.nativeElement.querySelector('mat-expansion-panel-header');
    const tableHeaderHeight = tableHeader ? tableHeader.offsetHeight : 0;
    const expandableHeaderHeight = expandableHeader ? expandableHeader.offsetHeight : 0;
    const detailsFooterHeight = detailsRow ? detailsRow.offsetHeight : 0;
    const totalHeight = this.appTable.nativeElement.clientHeight;
    const maxRowsHeight = totalHeight - expandableHeaderHeight - tableHeaderHeight - detailsFooterHeight;
    const customActions = this.appTable.nativeElement.querySelector('#customActions');
    if (customActions) {
      expandableHeader.style.paddingRight = '0';
    }
    if (this.tableConf.limitRowsByMaxHeight) {
      const prevRowsLimit = this.tableConf.limitRows;
      const tableRowSize = 48;
      this.tableConf.limitRows = Math.floor(maxRowsHeight / tableRowSize);
      if (prevRowsLimit !== this.tableConf.limitRows) {
        this.tableConf = { ...this.tableConf };
      }
    }
  }
}
