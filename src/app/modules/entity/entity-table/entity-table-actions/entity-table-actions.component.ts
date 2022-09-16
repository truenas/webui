import {
  Component, Input, OnInit, OnChanges,
} from '@angular/core';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';

@Component({
  selector: 'ix-entity-table-actions',
  styleUrls: ['./entity-table-actions.component.scss'],
  templateUrl: './entity-table-actions.component.html',
})
export class EntityTableActionsComponent implements OnInit, OnChanges {
  @Input() entity: EntityTableComponent;
  @Input() row: Record<string, unknown>;
  @Input() iconName = 'more_vert';
  @Input() action: string;
  @Input() groups = false;

  actions: EntityTableAction[];

  keyProp: string;

  get isSingleAction(): boolean {
    if (!this.actions) return;
    const hasGroups = Boolean(this.actions && this.actions[0].actionName);

    if (hasGroups) {
      return (this.actions[0].actions?.length === 1);
    }
    return (this.actions.length === 1);
  }

  get inlineActions(): boolean {
    return this.entity.conf.inlineActions || false;
  }

  ngOnInit(): void {
    if (this.entity.conf.config && this.entity.conf.config.deleteMsg) {
      this.keyProp = this.entity.conf.config.deleteMsg.key_props[0];
    } else if (this.entity.filterColumns) {
      this.keyProp = this.entity.filterColumns[0].prop;
    }
    this.getActions();
  }

  ngOnChanges(): void {
    this.getActions();
  }

  getActions(): void {
    this.actions = this.entity.getActions(this.row);
  }

  noPropagate(event: MouseEvent): void {
    event.stopPropagation();
  }

  get singleAction(): EntityTableAction {
    if (this.actions[0].actions === undefined) {
      return null;
    }
    const hasGroups = (this.actions);
    return this.actions && this.isSingleAction && hasGroups ? this.actions[0].actions[0] : this.actions[0];
  }
}
