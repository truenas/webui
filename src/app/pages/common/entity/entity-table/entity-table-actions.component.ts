import {
  Component, Input, OnInit, OnChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { RestService } from '../../../../services/rest.service';

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

  get isSingleAction() {
    if (!this.actions) return;
    const hasGroups = (this.actions && this.actions[0].actionName);

    if (hasGroups == true) {
      return (this.actions[0].actions.length == 1);
    }
    return (this.actions.length == 1);
  }

  get singleAction() {
    if (this.actions[0].actions == undefined) {
      return null;
    }
    const hasGroups = (this.actions[0].actions);
    const action = this.actions && this.isSingleAction && hasGroups ? this.actions[0].actions[0] : this.actions[0];

    return action;
  }

  constructor(protected translate: TranslateService) { }

  menuActionVisible(id: string) {
    if (id === 'edit' || id === 'delete') {
      return false;
    }
    return true;
  }

  ngOnInit() {
    if (this.entity.conf.config && this.entity.conf.config.deleteMsg) {
      this.key_prop = this.entity.conf.config.deleteMsg.key_props[0];
    } else if (this.entity.filterColumns) {
      this.key_prop = this.entity.filterColumns[0].prop;
    }
    this.getActions();
  }

  ngOnChanges() {
    this.getActions();
  }

  getActions() {
    this.actions = this.entity.getActions(this.row);
  }

  noPropogate(e) {
    e.stopPropagation();
  }
}
