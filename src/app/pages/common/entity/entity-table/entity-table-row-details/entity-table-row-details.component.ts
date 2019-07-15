import { Component, Input, OnChanges, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { EntityTableComponent } from '../entity-table.component';

@Component({
  selector: 'app-entity-table-row-details',
  templateUrl: './entity-table-row-details.component.html',
  styleUrls: ['./entity-table-row-details.component.scss']
})
export class EntityTableRowDetailsComponent implements OnInit, OnChanges {
  @Input() config: any;
  @Input() parent: EntityTableComponent & { conf: any };

  public columns = [];

  ngOnInit() {
    this.buildColumns();
  }

  ngOnChanges() {
    this.buildColumns();
  }

  getPropValue(prop) {
    return _.get(this.config, prop.split('.')) || 'N/A';
  }

  buildColumns(): void {
    this.columns = this.parent.allColumns.filter(col => !this.parent.conf.columns.some(c => c.prop === col.prop));
  }
}
