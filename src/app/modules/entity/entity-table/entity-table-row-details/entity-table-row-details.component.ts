import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import * as _ from 'lodash';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableColumn } from 'app/modules/entity/entity-table/entity-table.interface';
import { TaskService } from 'app/services/task.service';

@Component({
  selector: 'ix-entity-table-row-details',
  templateUrl: './entity-table-row-details.component.html',
  styleUrls: ['./entity-table-row-details.component.scss'],
})
export class EntityTableRowDetailsComponent implements OnInit, OnChanges {
  @Input() config: Record<string, unknown>;
  @Input() parent: EntityTableComponent<Record<string, unknown>>;

  columns: EntityTableColumn[] = [];
  actions: EntityTableAction[] = [];

  constructor(
    private taskService: TaskService,
  ) {}

  ngOnChanges(): void {
    this.buildColumns();
    this.actions = this.getActions();
  }

  ngOnInit(): void {
    this.buildColumns();
    this.actions = this.getActions();
  }

  getColumnValue(column: EntityTableColumn, isCronTime = false): unknown {
    const columnValue = _.get(this.config, column.prop.split('.')) as unknown;

    if (!columnValue) {
      return column.emptyText || 'N/A';
    }

    if (isCronTime) {
      return this.tryGetTaskCronDescription(columnValue);
    }

    return columnValue;
  }

  buildColumns(): void {
    this.columns = this.parent.allColumns.filter((col) => {
      return !this.parent.conf.columns.some((column) => column.prop === col.prop);
    });
  }

  getActions(): EntityTableAction[] {
    return this.parent.conf.getActions ? this.parent.conf.getActions(this.config) : this.parent.getActions(this.config);
  }

  private tryGetTaskCronDescription(val: unknown): unknown {
    try {
      return this.taskService.getTaskCronDescription(val as string, {});
    } catch (err: unknown) {
      console.error(err);
      return val;
    }
  }
}
