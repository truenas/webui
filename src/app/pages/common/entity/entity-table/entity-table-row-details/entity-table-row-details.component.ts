import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import cronstrue from 'cronstrue';
import * as _ from 'lodash';
import { EntityTableAction, EntityTableColumn } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityTableComponent } from '../entity-table.component';

@Component({
  selector: 'app-entity-table-row-details',
  templateUrl: './entity-table-row-details.component.html',
  styleUrls: ['./entity-table-row-details.component.scss'],
})
export class EntityTableRowDetailsComponent implements OnInit, OnChanges {
  @Input() config: any;
  @Input() parent: EntityTableComponent;

  columns: EntityTableColumn[] = [];
  actions: EntityTableAction[] = [];

  ngOnInit(): void {
    this.buildColumns();
    this.actions = this.getActions();
  }

  ngOnChanges(): void {
    this.buildColumns();
    this.actions = this.getActions();
  }

  getPropValue(prop: string, isCronTime = false): any {
    let val = _.get(this.config, prop.split('.'));
    if (val === undefined || val === null) {
      val = 'N/A';
    }
    return isCronTime ? (val !== 'N/A' ? cronstrue.toString(val) : val) : val;
  }

  buildColumns(): void {
    this.columns = this.parent.allColumns.filter((col) => {
      return !this.parent.conf.columns.some((column) => column.prop === col.prop);
    });
  }

  getActions(): EntityTableAction[] {
    return this.parent.conf.getActions ? this.parent.conf.getActions(this.config) : this.parent.getActions(this.config);
  }
}
