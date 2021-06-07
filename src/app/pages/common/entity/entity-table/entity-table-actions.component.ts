import {
  Component, Input, OnInit, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from './entity-table.component';

@Component({
  selector: 'app-entity-table-actions',
  styleUrls: ['./entity-table-actions.component.scss'],
  templateUrl: './entity-table-actions.component.html',
})
export class EntityTableActionsComponent implements OnInit, OnChanges {
  @Input('entity') entity: EntityTableComponent & { conf: any };
  @Input('row') row: any;
  @Input('icon_name') icon_name = 'more_vert';
  @Input('action') action: any;
  @Input('groups') groups = false;

  actions: any[];
  showMenu = true;
  key_prop: string;

  get isSingleAction(): boolean {
    if (!this.actions) return;
    const hasGroups = (this.actions && this.actions[0].actionName);

    if (hasGroups == true) {
      return (this.actions[0].actions.length == 1);
    }
    return (this.actions.length == 1);
  }

  get inlineActions(): boolean {
    return this.entity.conf.inlineActions || false;
  }

  constructor(protected translate: TranslateService) { }

  menuActionVisible(id: string): boolean {
    if (id === 'edit' || id === 'delete') {
      return false;
    }
    return true;
  }

  ngOnInit(): void {
    if (this.entity.conf.config && this.entity.conf.config.deleteMsg) {
      this.key_prop = this.entity.conf.config.deleteMsg.key_props[0];
    } else if (this.entity.filterColumns) {
      this.key_prop = this.entity.filterColumns[0].prop;
    }
    this.getActions();
  }

  ngOnChanges(): void {
    this.getActions();
  }

  getActions(): void {
    this.actions = this.entity.getActions(this.row);
  }

  noPropogate(e: MouseEvent): void {
    e.stopPropagation();
  }

  get singleAction(): any {
    if (this.actions[0].actions == undefined) {
      return null;
    }
    const hasGroups = (this.actions);
    const action = this.actions && this.isSingleAction && hasGroups ? this.actions[0].actions[0] : this.actions[0];

    return action;
  }
}
